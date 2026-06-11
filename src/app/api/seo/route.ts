import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { optimizeForShopify, optimizeForEbay } from '@/lib/ai/claude';
import { generateEmbedding } from '@/lib/ai/openai';
import type { Platform } from '@/types/database';

/** Request body for the SEO optimization endpoint. */
interface SEORequestBody {
  productListingId: string;
  platform: Platform;
}

/**
 * POST /api/seo
 *
 * Optimizes a product listing's SEO content using AI.
 * Fetches the product from the database, runs platform-specific
 * optimization via Claude, generates an embedding, updates the
 * listing, and logs the optimization attempt.
 *
 * @param request - The incoming request with productListingId and platform
 * @returns The optimized SEO data as JSON
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
    const body = (await request.json()) as SEORequestBody;
    const { productListingId, platform } = body;

    if (!productListingId || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: productListingId, platform' },
        { status: 400 }
      );
    }

    if (platform !== 'shopify' && platform !== 'ebay') {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "shopify" or "ebay"' },
        { status: 400 }
      );
    }

    // ── Fetch product listing ───────────────────────────────
    const { data: product, error: fetchError } = await supabase
      .from('product_listings')
      .select('*')
      .eq('id', productListingId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product listing not found' },
        { status: 404 }
      );
    }

    // ── Mark as processing ──────────────────────────────────
    await supabase
      .from('product_listings')
      .update({ optimization_status: 'processing' })
      .eq('id', productListingId);

    // ── Run platform-specific optimization ──────────────────
    const productInput = {
      title: product.original_title as string,
      description: (product.original_description as string) ?? '',
      category: (product.original_category as string) ?? '',
      price: (product.price as number) ?? 0,
      images: (product.images as string[]) ?? [],
    };

    let optimizedData: {
      optimizedTitle: string;
      optimizedDescription: string;
      bulletPoints: string[];
      itemSpecifics: Record<string, string>;
      seoScore: number;
    };

    if (platform === 'shopify') {
      const result = await optimizeForShopify(productInput);
      optimizedData = {
        optimizedTitle: result.optimizedTitle,
        optimizedDescription: result.optimizedDescription,
        bulletPoints: [],
        itemSpecifics: {},
        seoScore: result.seoScore,
      };
    } else {
      const result = await optimizeForEbay(productInput);
      optimizedData = {
        optimizedTitle: result.optimizedTitle,
        optimizedDescription: result.structuredDescription,
        bulletPoints: result.bulletPoints,
        itemSpecifics: result.itemSpecifics,
        seoScore: result.seoScore,
      };
    }

    // ── Generate embedding ──────────────────────────────────
    const embeddingText = `${optimizedData.optimizedTitle} ${optimizedData.optimizedDescription}`;
    const embedding = await generateEmbedding(embeddingText);

    // ── Update product listing ──────────────────────────────
    const { error: updateError } = await supabase
      .from('product_listings')
      .update({
        optimized_title: optimizedData.optimizedTitle,
        optimized_description: optimizedData.optimizedDescription,
        optimized_bullet_points: optimizedData.bulletPoints,
        item_specifics: optimizedData.itemSpecifics,
        seo_score: optimizedData.seoScore,
        embedding,
        optimization_status: 'optimized',
        optimization_attempts: (product.optimization_attempts as number) + 1,
        last_optimized_at: new Date().toISOString(),
      })
      .eq('id', productListingId);

    if (updateError) {
      throw new Error(`Failed to update product: ${updateError.message}`);
    }

    // ── Log the optimization ────────────────────────────────
    await supabase.from('seo_optimization_logs').insert({
      product_listing_id: productListingId,
      user_id: user.id,
      platform,
      attempt_number: (product.optimization_attempts as number) + 1,
      original_title: product.original_title,
      generated_title: optimizedData.optimizedTitle,
      generated_description: optimizedData.optimizedDescription,
      generated_bullet_points: optimizedData.bulletPoints,
      generated_item_specifics: optimizedData.itemSpecifics,
      seo_score: optimizedData.seoScore,
      model_used: 'claude-sonnet-4-20250514',
      prompt_tokens: 0, // Token usage would come from the response in production
      completion_tokens: 0,
      status: 'accepted',
    });

    return NextResponse.json({
      success: true,
      data: optimizedData,
    });
  } catch (error) {
    console.error(
      'SEO optimization error:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(
      {
        error: 'SEO optimization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
