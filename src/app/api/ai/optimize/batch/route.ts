import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are an elite e-commerce SEO expert and professional copywriter for eBay. 
Your primary goals are:
1. MAXIMIZE SEO: Stuff the title and description with high-converting, heavily searched keywords.
2. ELITE SALES COPY: Write the description so it sounds like a highly professional, trustworthy, premium brand.
3. OBEY EBAY RULES: The title MUST NOT exceed 80 characters. EVER. 
4. PRESERVE DATA: Never remove or alter product model numbers, part numbers, or brand names.

Return the result as a strict JSON object with this exact structure (no markdown, just JSON):
{
  "optimized_title": "String (Max 80 chars)",
  "optimized_description": "String (HTML allowed, highly professional sales copy)",
  "seo_score": Number (1-100, your confident rating of how well this will rank)
}`;

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find pending listings
    const { data: listings, error: fetchError } = await supabase
      .from('product_listings')
      .select('id, original_title, original_description')
      .eq('user_id', user.id)
      .in('optimization_status', ['pending', 'failed'])
      .limit(5); // Process in small batches to avoid Vercel timeouts

    if (fetchError || !listings || listings.length === 0) {
      return NextResponse.json({ message: 'No listings to optimize' });
    }

    // Mark as processing
    await supabase
      .from('product_listings')
      .update({ optimization_status: 'processing' })
      .in('id', listings.map(l => l.id));

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Process each listing (in production, we'd use QStash for background jobs)
    for (const listing of listings) {
      try {
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1000,
          temperature: 0.7,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Optimize this eBay listing:\nTITLE: ${listing.original_title}\nDESCRIPTION: ${listing.original_description || 'No description provided.'}`
            }
          ]
        });

        // The response should be pure JSON
        // @ts-ignore
        const textContent = message.content[0].text;
        
        // Strip markdown code block if Claude added it
        const jsonStr = textContent.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(jsonStr);

        // Update database
        await supabase
          .from('product_listings')
          .update({
            optimized_title: result.optimized_title.substring(0, 80), // hard safety net
            optimized_description: result.optimized_description,
            seo_score: result.seo_score,
            optimization_status: 'optimized',
            last_optimized_at: new Date().toISOString()
          })
          .eq('id', listing.id);

      } catch (err: any) {
        console.error(`Failed to optimize listing ${listing.id}:`, err);
        // Mark as failed so it can be retried
        await supabase
          .from('product_listings')
          .update({ optimization_status: 'failed', optimization_error: err.message })
          .eq('id', listing.id);
      }
    }

    return NextResponse.json({ message: `Batch optimization triggered.` });

  } catch (error: any) {
    console.error('AI Batch Endpoint Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
