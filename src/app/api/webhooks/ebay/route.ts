import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/encryption';
import { EbayClient } from '@/lib/store/ebay';
import { ShopifyClient } from '@/lib/store/shopify';
import type { StoreCredential } from '@/types/database';

/** eBay notification payload. */
interface EbayNotificationPayload {
  metadata: {
    topic: string;
    schemaVersion: string;
    deprecated: boolean;
  };
  notification: {
    notificationId: string;
    eventDate: string;
    publishDate: string;
    publishAttemptCount: number;
    data: {
      sku?: string;
      offerId?: string;
      quantity?: number;
      orderId?: string;
      lineItems?: EbayNotificationLineItem[];
    };
  };
}

/** eBay notification line item. */
interface EbayNotificationLineItem {
  sku: string;
  quantity: number;
  title: string;
}

/**
 * POST /api/webhooks/ebay
 *
 * Handles eBay push notification webhooks.
 * Verifies the notification signature, parses inventory/order changes,
 * and synchronizes inventory across connected platforms.
 *
 * @param request - The incoming eBay notification request
 * @returns 200 OK immediately (webhook best practice)
 */
export async function POST(request: Request) {
  try {
    // ── Read raw body for signature verification ────────────
    const rawBody = await request.text();
    const signature = request.headers.get('X-Ebay-Signature') ?? '';
    const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;

    if (!verificationToken) {
      console.error('eBay webhook: Missing verification token');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // ── Verify notification signature ───────────────────────
    const isValid = EbayClient.verifyNotification(
      signature,
      rawBody,
      verificationToken
    );

    if (!isValid) {
      console.error('eBay webhook: Invalid notification signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ── Parse payload ───────────────────────────────────────
    const payload = JSON.parse(rawBody) as EbayNotificationPayload;
    const { topic } = payload.metadata;
    const { data } = payload.notification;

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // ── Handle inventory/order changes ──────────────────────
    const skusToSync: Array<{ sku: string; quantity: number }> = [];

    if (data.sku && data.quantity !== undefined) {
      // Direct inventory update notification
      skusToSync.push({ sku: data.sku, quantity: data.quantity });
    } else if (data.lineItems && data.lineItems.length > 0) {
      // Order notification with line items
      for (const lineItem of data.lineItems) {
        if (lineItem.sku) {
          skusToSync.push({
            sku: lineItem.sku,
            quantity: lineItem.quantity,
          });
        }
      }
    }

    if (skusToSync.length === 0) {
      return NextResponse.json(
        { received: true, topic },
        { status: 200 }
      );
    }

    // ── Cross-platform inventory sync ───────────────────────
    for (const { sku, quantity } of skusToSync) {
      try {
        // Find the eBay product listing and its store credential
        const { data: ebayProduct } = await supabase
          .from('product_listings')
          .select('*, store_credentials!inner(*)')
          .eq('sku', sku)
          .eq('platform', 'ebay')
          .single();

        if (!ebayProduct) {
          console.warn(`eBay webhook: No product found for SKU ${sku}`);
          continue;
        }

        const ebayStore = ebayProduct.store_credentials as StoreCredential;

        // Find matching products on OTHER platforms by SKU
        const { data: crossPlatformProducts } = await supabase
          .from('product_listings')
          .select('*, store_credentials!inner(*)')
          .eq('sku', sku)
          .neq('platform', 'ebay')
          .eq('user_id', ebayStore.user_id);

        if (!crossPlatformProducts || crossPlatformProducts.length === 0) {
          continue;
        }

        for (const product of crossPlatformProducts) {
          const targetStore = product.store_credentials as StoreCredential;

          try {
            const targetAccessToken = decrypt(
              targetStore.encrypted_access_token
            );

            if (targetStore.platform === 'shopify') {
              const shopifyClient = new ShopifyClient(
                targetStore.store_url,
                targetAccessToken
              );

              // Get the Shopify product to find inventory item ID
              const shopifyProduct = await shopifyClient.getProduct(
                product.external_product_id as string
              );

              if (
                shopifyProduct.variants &&
                shopifyProduct.variants.length > 0
              ) {
                const variant = shopifyProduct.variants[0];
                const inventoryItemId = variant.inventory_item_id;

                // Get current inventory levels
                const levels =
                  await shopifyClient.getInventoryLevels([inventoryItemId]);

                if (levels.length > 0) {
                  const currentLevel = levels[0];
                  const previousQuantity = currentLevel.available ?? 0;

                  // Calculate new quantity based on order deduction
                  const newQuantity = Math.max(
                    0,
                    previousQuantity - quantity
                  );

                  await shopifyClient.setInventoryLevel(
                    inventoryItemId,
                    currentLevel.location_id,
                    newQuantity
                  );

                  // Log successful sync
                  await supabase.from('inventory_sync_logs').insert({
                    user_id: ebayStore.user_id,
                    source_platform: 'ebay',
                    source_sku: sku,
                    target_platform: 'shopify',
                    target_sku: product.sku ?? sku,
                    previous_quantity: previousQuantity,
                    new_quantity: newQuantity,
                    sync_status: 'success',
                  });
                }
              }
            }
          } catch (syncError) {
            console.error(
              `Failed to sync inventory for SKU ${sku} to ${targetStore.platform}:`,
              syncError instanceof Error
                ? syncError.message
                : 'Unknown error'
            );

            // Log failed sync
            await supabase.from('inventory_sync_logs').insert({
              user_id: ebayStore.user_id,
              source_platform: 'ebay',
              source_sku: sku,
              target_platform: targetStore.platform,
              target_sku: product.sku ?? sku,
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
          `Error processing eBay SKU ${sku}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    // Return 200 immediately (webhook best practice)
    return NextResponse.json(
      { received: true, topic },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'eBay webhook error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    // Still return 200 to prevent eBay from retrying
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
