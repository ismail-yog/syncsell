import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/encryption';
import { ShopifyClient } from '@/lib/store/shopify';
import { EbayClient } from '@/lib/store/ebay';
import type { StoreCredential } from '@/types/database';

/** Shopify order line item from webhook payload. */
interface ShopifyLineItem {
  variant_id: number;
  sku: string;
  quantity: number;
  product_id: number;
  title: string;
}

/** Shopify order webhook payload. */
interface ShopifyOrderPayload {
  id: number;
  line_items: ShopifyLineItem[];
  created_at: string;
}

/**
 * POST /api/webhooks/shopify
 *
 * Handles Shopify order/inventory webhooks.
 * Verifies the HMAC signature, extracts line items, finds matching
 * products on other platforms by SKU, and pushes inventory updates
 * for cross-platform synchronization.
 *
 * @param request - The incoming Shopify webhook request
 * @returns 200 OK immediately (webhook best practice)
 */
export async function POST(request: Request) {
  try {
    // ── Read raw body for HMAC verification ─────────────────
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');
    const shopifySecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!hmacHeader || !shopifySecret) {
      console.error('Shopify webhook: Missing HMAC header or secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Verify webhook signature ────────────────────────────
    const isValid = ShopifyClient.verifyWebhook(
      rawBody,
      hmacHeader,
      shopifySecret
    );

    if (!isValid) {
      console.error('Shopify webhook: Invalid HMAC signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ── Parse payload ───────────────────────────────────────
    const payload = JSON.parse(rawBody) as ShopifyOrderPayload;
    const lineItems = payload.line_items ?? [];

    if (lineItems.length === 0) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ── Process in background ───────────────────────────────
    // Use admin client to bypass RLS for cross-user webhook processing
    const supabase = createAdminClient();

    // Identify the shop domain from headers to find the store credential
    const shopDomain = request.headers.get('X-Shopify-Shop-Domain') ?? '';

    // Find the store credential for this Shopify domain
    const { data: storeCredential } = await supabase
      .from('store_credentials')
      .select('*')
      .eq('platform', 'shopify')
      .eq('is_active', true)
      .ilike('store_url', `%${shopDomain}%`)
      .single();

    if (!storeCredential) {
      console.error(
        `Shopify webhook: No store credential found for ${shopDomain}`
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const store = storeCredential as StoreCredential;

    // ── Cross-platform inventory sync ───────────────────────
    for (const lineItem of lineItems) {
      if (!lineItem.sku) continue;

      try {
        // Find matching products on OTHER platforms by SKU
        const { data: crossPlatformProducts } = await supabase
          .from('product_listings')
          .select('*, store_credentials!inner(*)')
          .eq('sku', lineItem.sku)
          .neq('platform', 'shopify')
          .eq('user_id', store.user_id);

        if (!crossPlatformProducts || crossPlatformProducts.length === 0) {
          continue;
        }

        for (const product of crossPlatformProducts) {
          const targetStore = product.store_credentials as StoreCredential;

          try {
            const targetAccessToken = decrypt(
              targetStore.encrypted_access_token
            );

            // Push inventory update to the target platform
            if (targetStore.platform === 'ebay') {
              const ebayClient = new EbayClient(targetAccessToken);
              const inventoryItem = await ebayClient.getInventoryItem(
                product.sku as string
              );
              const currentQty =
                inventoryItem.availability.shipToLocationAvailability.quantity;
              const newQty = Math.max(0, currentQty - lineItem.quantity);

              await ebayClient.createOrReplaceInventoryItem(
                product.sku as string,
                {
                  ...inventoryItem,
                  availability: {
                    shipToLocationAvailability: { quantity: newQty },
                  },
                }
              );

              // Log sync attempt
              await supabase.from('inventory_sync_logs').insert({
                user_id: store.user_id,
                source_platform: 'shopify',
                source_sku: lineItem.sku,
                target_platform: 'ebay',
                target_sku: product.sku,
                previous_quantity: currentQty,
                new_quantity: newQty,
                sync_status: 'success',
              });
            }
          } catch (syncError) {
            console.error(
              `Failed to sync inventory for SKU ${lineItem.sku} to ${targetStore.platform}:`,
              syncError instanceof Error
                ? syncError.message
                : 'Unknown error'
            );

            // Log failed sync attempt
            await supabase.from('inventory_sync_logs').insert({
              user_id: store.user_id,
              source_platform: 'shopify',
              source_sku: lineItem.sku,
              target_platform: targetStore.platform,
              target_sku: product.sku ?? lineItem.sku,
              previous_quantity: 0,
              new_quantity: 0,
              sync_status: 'failed',
              error_message:
                syncError instanceof Error
                  ? syncError.message
                  : 'Unknown error',
            });
          }
        }
      } catch (error) {
        console.error(
          `Error processing line item SKU ${lineItem.sku}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // Return 200 immediately (webhook best practice)
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(
      'Shopify webhook error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    // Still return 200 to prevent Shopify from retrying
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
