import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';
import { ShopifyClient } from '@/lib/store/shopify';
import { EbayClient } from '@/lib/store/ebay';
import type { Platform, StoreCredential } from '@/types/database';

/** Request body for the sync endpoint. */
interface SyncRequestBody {
  storeCredentialId: string;
}

/** Sync operation summary. */
interface SyncSummary {
  synced: number;
  created: number;
  updated: number;
  errors: number;
}

/**
 * POST /api/sync
 *
 * Synchronizes the product catalog from a connected store.
 * Fetches all products from the platform API and upserts them
 * into the product_listings table.
 *
 * @param request - The incoming request with storeCredentialId
 * @returns Sync summary with counts of created, updated, and errored products
 */
export async function POST(request: Request) {
  try {
    // ── Auth check ──────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ── Parse request ───────────────────────────────────────
    const body = (await request.json()) as SyncRequestBody;
    const { storeCredentialId } = body;

    if (!storeCredentialId) {
      return NextResponse.json(
        { error: 'Missing required field: storeCredentialId' },
        { status: 400 }
      );
    }

    // ── Fetch store credentials ─────────────────────────────
    const { data: credential, error: credError } = await supabase
      .from('store_credentials')
      .select('*')
      .eq('id', storeCredentialId)
      .eq('user_id', user.id)
      .single();

    if (credError || !credential) {
      return NextResponse.json(
        { error: 'Store credential not found' },
        { status: 404 }
      );
    }

    const store = credential as StoreCredential;

    if (!store.is_active) {
      return NextResponse.json(
        { error: 'Store credential is inactive' },
        { status: 400 }
      );
    }

    // ── Decrypt tokens ──────────────────────────────────────
    const accessToken = decrypt(store.encrypted_access_token);

    // ── Sync based on platform ──────────────────────────────
    const platform: Platform = store.platform;
    const summary: SyncSummary = {
      synced: 0,
      created: 0,
      updated: 0,
      errors: 0,
    };

    if (platform === 'shopify') {
      await syncShopify(supabase, user.id, store, accessToken, summary);
    } else if (platform === 'ebay') {
      await syncEbay(supabase, user.id, store, accessToken, summary);
    } else {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error(
      'Sync error:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      {
        error: 'Catalog sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Syncs products from a Shopify store into the product_listings table.
 *
 * @param supabase - The authenticated Supabase client
 * @param userId - The current user's ID
 * @param store - The store credential record
 * @param accessToken - The decrypted Shopify access token
 * @param summary - The sync summary to update in place
 */
async function syncShopify(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  store: StoreCredential,
  accessToken: string,
  summary: SyncSummary
): Promise<void> {
  const client = new ShopifyClient(store.store_url, accessToken);
  let pageInfo: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await client.getProducts(250, pageInfo);
    const products = response.data;

    for (const product of products) {
      try {
        const sku =
          product.variants.length > 0 ? product.variants[0].sku : null;
        const price =
          product.variants.length > 0
            ? parseFloat(product.variants[0].price)
            : null;
        const images = product.images.map((img) => img.src);

        // Check if product already exists
        const { data: existing } = await supabase
          .from('product_listings')
          .select('id')
          .eq('store_credential_id', store.id)
          .eq('external_product_id', String(product.id))
          .single();

        const listingData = {
          user_id: userId,
          store_credential_id: store.id,
          platform: 'shopify' as Platform,
          external_product_id: String(product.id),
          sku,
          original_title: product.title,
          original_description: product.body_html,
          original_category: product.product_type || null,
          price,
          currency: 'USD',
          image_url: images.length > 0 ? images[0] : null,
          images,
          last_synced_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase
            .from('product_listings')
            .update(listingData)
            .eq('id', existing.id);
          summary.updated++;
        } else {
          await supabase.from('product_listings').insert({
            ...listingData,
            optimization_status: 'pending',
            optimization_attempts: 0,
            original_bullet_points: [],
            optimized_bullet_points: [],
            item_specifics: {},
          });
          summary.created++;
        }

        summary.synced++;
      } catch (error) {
        console.error(
          `Failed to sync Shopify product ${product.id}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        summary.errors++;
      }
    }

    // Shopify pagination
    pageInfo = response.pageInfo ?? undefined;
    hasMore = products.length === 250 && !!pageInfo;
  }
}

/**
 * Syncs products from an eBay store into the product_listings table.
 *
 * @param supabase - The authenticated Supabase client
 * @param userId - The current user's ID
 * @param store - The store credential record
 * @param accessToken - The decrypted eBay access token
 * @param summary - The sync summary to update in place
 */
async function syncEbay(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  store: StoreCredential,
  accessToken: string,
  summary: SyncSummary
): Promise<void> {
  const client = new EbayClient(accessToken);
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await client.getInventoryItems(limit, offset);
    const items = response.inventoryItems ?? [];

    for (const item of items) {
      try {
        const images = item.product.imageUrls ?? [];
        const price = null; // Price comes from offers, not inventory items

        // Check if product already exists
        const { data: existing } = await supabase
          .from('product_listings')
          .select('id')
          .eq('store_credential_id', store.id)
          .eq('external_product_id', item.sku)
          .single();

        const listingData = {
          user_id: userId,
          store_credential_id: store.id,
          platform: 'ebay' as Platform,
          external_product_id: item.sku,
          sku: item.sku,
          original_title: item.product.title,
          original_description: item.product.description,
          original_category: null,
          price,
          currency: 'USD',
          image_url: images.length > 0 ? images[0] : null,
          images,
          last_synced_at: new Date().toISOString(),
        };

        if (existing) {
          await supabase
            .from('product_listings')
            .update(listingData)
            .eq('id', existing.id);
          summary.updated++;
        } else {
          await supabase.from('product_listings').insert({
            ...listingData,
            optimization_status: 'pending',
            optimization_attempts: 0,
            original_bullet_points: [],
            optimized_bullet_points: [],
            item_specifics: {},
          });
          summary.created++;
        }

        summary.synced++;
      } catch (error) {
        console.error(
          `Failed to sync eBay item ${item.sku}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        summary.errors++;
      }
    }

    offset += limit;
    hasMore = items.length === limit;
  }
}
