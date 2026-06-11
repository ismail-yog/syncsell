import Anthropic from '@anthropic-ai/sdk';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Input product data for SEO optimization. */
export interface ProductInput {
  title: string;
  description: string;
  category: string;
  price: number;
  images: string[];
}

/** SEO optimization result tailored for Shopify. */
export interface ShopifySEOResult {
  optimizedTitle: string;
  metaTitle: string;
  metaDescription: string;
  optimizedDescription: string;
  seoScore: number;
}

/** SEO optimization result tailored for eBay. */
export interface EbaySEOResult {
  optimizedTitle: string;
  subtitle: string;
  itemSpecifics: Record<string, string>;
  bulletPoints: string[];
  structuredDescription: string;
  seoScore: number;
}

// ─────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

// ─────────────────────────────────────────────────────────────
// Shopify SEO Optimization
// ─────────────────────────────────────────────────────────────

const SHOPIFY_SYSTEM_PROMPT = `You are a world-class Shopify conversion copywriter and SEO strategist with 15+ years of experience optimizing product pages that generate millions in revenue. Your writing has been studied by top DTC brands.

## YOUR CORE PRINCIPLES

**Benefit-First, Not Feature-First:** Every sentence must answer the customer's silent question: "What's in it for ME?" Transform cold features into warm, tangible benefits the customer can feel, see, or experience.

**Emotional Power Words:** Strategically deploy words that trigger emotion and urgency:
- Desire: "luxurious," "indulgent," "effortless," "stunning," "transformative"
- Trust: "clinically proven," "award-winning," "handcrafted," "guaranteed"
- Urgency: "limited edition," "selling fast," "while supplies last"
- Exclusivity: "insider," "curated," "artisanal," "bespoke"

**Scannable Structure:** Use H2 and H3 headings to break up content. Modern shoppers scan before they read. Guide their eye with a clear visual hierarchy.

**Natural CTAs:** Embed 2–3 calls-to-action that flow naturally within the description — never forced, never salesy. Example: "Experience the difference — add to cart and feel the quality for yourself."

**SEO Precision:**
- Meta title: Under 60 characters with the primary keyword near the front
- Meta description: Under 155 characters, compelling and click-worthy
- Natural keyword density of 2–3% for the primary keyword
- Use semantic variations and LSI keywords throughout

**Readability:** Write at a grade 8 reading level. Short sentences. Short paragraphs. Active voice. Conversational tone that feels premium.

**Social Proof Language:** Weave in phrases like "Join thousands of happy customers," "Our best-seller for a reason," or "See why [X] people can't stop raving."

**Product Narrative:** Create a compelling micro-story — paint a picture of the customer's life WITH this product. Make them visualize the transformation.

## OUTPUT FORMAT (STRICT JSON)

You MUST return a valid JSON object with these exact keys:
{
  "optimizedTitle": "Benefit-driven product title (50-70 chars)",
  "metaTitle": "SEO meta title under 60 chars with primary keyword",
  "metaDescription": "Compelling meta description under 155 chars that drives clicks",
  "optimizedDescription": "Rich HTML description with <h2>, <h3>, <p>, <ul>, <li> tags. Include benefit bullets, CTAs, and emotional storytelling. At least 200 words.",
  "seoScore": 0
}

## SEO SCORE CALCULATION

Calculate seoScore (0-100) based on:
- Title keyword optimization (0-20): Primary keyword present, benefit-driven, 50-70 chars
- Meta tag quality (0-20): Meta title <60 chars with keyword, meta desc <155 chars with CTA
- Description completeness (0-25): 200+ words, H2/H3 structure, benefit bullets, CTAs, emotional copy
- Keyword density (0-15): 2-3% primary keyword, LSI keywords present
- Social proof & urgency (0-10): Social proof language, urgency triggers
- Readability (0-10): Grade 8 level, short paragraphs, active voice`;

/**
 * Optimizes a product listing for the Shopify platform using Claude AI.
 * Generates SEO-optimized title, meta tags, and rich HTML description
 * with benefit-driven copy, CTAs, and emotional storytelling.
 *
 * @param product - The product data to optimize
 * @returns Optimized Shopify SEO content with computed seoScore
 * @throws Error if the AI API call fails or response parsing fails
 */
export async function optimizeForShopify(
  product: ProductInput
): Promise<ShopifySEOResult> {
  try {
    const userPrompt = `Optimize this product for Shopify:

**Title:** ${product.title}
**Description:** ${product.description}
**Category:** ${product.category}
**Price:** $${product.price}
**Images:** ${product.images.length} product image(s)

Generate the optimized content following the exact JSON format specified. Make the description compelling, SEO-rich, and conversion-optimized.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SHOPIFY_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response received from Claude');
    }

    // Extract JSON from potential markdown fences
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const result = JSON.parse(jsonMatch[0]) as ShopifySEOResult;

    // Validate and clamp seoScore
    result.seoScore = Math.max(0, Math.min(100, Math.round(result.seoScore)));

    return result;
  } catch (error) {
    throw new Error(
      `Shopify SEO optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// eBay SEO Optimization
// ─────────────────────────────────────────────────────────────

const EBAY_SYSTEM_PROMPT = `You are an elite eBay Cassini search algorithm expert and listing optimization specialist. You have deep expertise in eBay's Best Match ranking system and have helped thousands of sellers achieve Top Rated Plus status.

## YOUR CORE PRINCIPLES

**Title Mastery (80 Characters Max):**
- Front-load the title with the highest-volume search keywords
- Use ALL 80 characters — every unused character is a missed search opportunity
- Follow the formula: Brand + Model + Key Feature + Size/Color + Condition
- NEVER use ALL CAPS (eBay penalizes this)
- NEVER use excessive punctuation (!, *, #)
- Use spaces between words, not hyphens (unless part of model name)
- Include the most common search synonyms

**Item Specifics Mastery:**
- Fill EVERY available field — this is the #1 Cassini ranking factor
- Required fields: Brand, MPN (Manufacturer Part Number), Type, Model, Material, Color, Size, UPC, Country/Region of Manufacture, Warranty
- Use exact values from eBay's dropdown options when possible
- If unknown, provide best inference with "N/A" as last resort

**Bullet Points (Technical Specifications):**
- Generate 5–8 concise, specification-focused bullet points
- Lead with the most important spec buyers search for
- Include dimensions, weight, compatibility, materials
- Format: "Key Feature: Specific Detail"

**Structured HTML Description:**
- Use clean, mobile-responsive HTML
- Include an organized specifications table
- Add compatibility section if applicable
- Include condition details (New, Refurbished, Used)
- Add warranty/return information section
- NO JavaScript, NO external CSS, NO iframes (eBay blocks these)

**Best Match Algorithm Optimization:**
- Prioritize recent sales velocity signals in your title keywords
- Optimize for buyer intent keywords, not generic terms
- Include condition-specific details to reduce returns (boosts seller metrics)

## OUTPUT FORMAT (STRICT JSON)

You MUST return a valid JSON object with these exact keys:
{
  "optimizedTitle": "Exactly optimized eBay title using all 80 chars",
  "subtitle": "Compelling subtitle highlighting key benefit or USP",
  "itemSpecifics": {
    "Brand": "...",
    "MPN": "...",
    "Type": "...",
    "Model": "...",
    "Material": "...",
    "Color": "...",
    "Size": "...",
    "UPC": "...",
    "Country/Region of Manufacture": "...",
    "Warranty": "..."
  },
  "bulletPoints": ["Spec 1: Detail", "Spec 2: Detail", "..."],
  "structuredDescription": "<div>Clean HTML description with specs table</div>",
  "seoScore": 0
}

## SEO SCORE CALCULATION

Calculate seoScore (0-100) based on:
- Title optimization (0-25): All 80 chars used, keywords front-loaded, proper format
- Item Specifics coverage (0-25): All 10 key fields filled with accurate data
- Bullet point quality (0-15): 5-8 specs, technical details, searchable terms
- Description structure (0-15): HTML tables, compatibility, condition details
- Cassini signal optimization (0-10): Buyer intent keywords, category alignment
- Mobile readability (0-10): Clean HTML, no external resources, responsive`;

/**
 * Optimizes a product listing for the eBay platform using Claude AI.
 * Generates Cassini-algorithm-optimized titles, item specifics, bullet points,
 * and structured HTML descriptions.
 *
 * @param product - The product data to optimize
 * @returns Optimized eBay SEO content with computed seoScore
 * @throws Error if the AI API call fails or response parsing fails
 */
export async function optimizeForEbay(
  product: ProductInput
): Promise<EbaySEOResult> {
  try {
    const userPrompt = `Optimize this product listing for eBay:

**Title:** ${product.title}
**Description:** ${product.description}
**Category:** ${product.category}
**Price:** $${product.price}
**Images:** ${product.images.length} product image(s)

Generate the optimized content following the exact JSON format specified. Maximize Cassini ranking potential and conversion rate.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: EBAY_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response received from Claude');
    }

    // Extract JSON from potential markdown fences
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const result = JSON.parse(jsonMatch[0]) as EbaySEOResult;

    // Validate title length
    if (result.optimizedTitle.length > 80) {
      result.optimizedTitle = result.optimizedTitle.substring(0, 80).trim();
    }

    // Ensure bullet points array exists
    if (!Array.isArray(result.bulletPoints)) {
      result.bulletPoints = [];
    }

    // Ensure item specifics is an object
    if (typeof result.itemSpecifics !== 'object' || result.itemSpecifics === null) {
      result.itemSpecifics = {};
    }

    // Validate and clamp seoScore
    result.seoScore = Math.max(0, Math.min(100, Math.round(result.seoScore)));

    return result;
  } catch (error) {
    throw new Error(
      `eBay SEO optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
