import Anthropic from '@anthropic-ai/sdk';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Input product data for attribute mapping. */
export interface MappingProductInput {
  title: string;
  description: string;
  category?: string;
  price?: number;
  images?: string[];
}

/** A Shopify metafield definition. */
export interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

/** Supported platforms for category suggestion. */
export type MappingPlatform = 'shopify' | 'ebay';

// ─────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

// ─────────────────────────────────────────────────────────────
// eBay Item Specifics Mapping
// ─────────────────────────────────────────────────────────────

/**
 * Uses Claude AI to analyze a product and automatically map its attributes
 * to eBay Item Specifics fields. Infers values from title, description,
 * and available product metadata.
 *
 * @param product - The product data to analyze
 * @returns A record of eBay Item Specific field names to their inferred values
 * @throws Error if the AI call or parsing fails
 */
export async function mapToEbaySpecifics(
  product: MappingProductInput
): Promise<Record<string, string>> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are an expert at analyzing product data and mapping attributes to eBay Item Specifics.

Analyze the product information provided and infer as many Item Specifics as possible.

Required fields to attempt:
- Brand
- MPN (Manufacturer Part Number)
- Type
- Model
- Material
- Color
- Size
- UPC
- Country/Region of Manufacture
- Warranty
- Condition

Also include any additional category-specific Item Specifics that would be relevant.

Rules:
- Only include fields where you can make a reasonable inference
- Use "Does Not Apply" only for MPN/UPC when genuinely unknown
- Never fabricate UPC/MPN numbers — use "Does Not Apply" if unknown
- Use standard eBay terminology for values

Return a valid JSON object with field names as keys and values as strings. No other text.`,
      messages: [
        {
          role: 'user',
          content: `Product Title: ${product.title}
Description: ${product.description}
Category: ${product.category ?? 'Unknown'}
Price: ${product.price ? `$${product.price}` : 'Unknown'}
Images: ${product.images?.length ?? 0} available`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response received from Claude');
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from mapper response');
    }

    return JSON.parse(jsonMatch[0]) as Record<string, string>;
  } catch (error) {
    throw new Error(
      `eBay specifics mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Shopify Metafields Mapping
// ─────────────────────────────────────────────────────────────

/**
 * Uses Claude AI to analyze a product and generate appropriate
 * Shopify metafield definitions with namespace, key, value, and type.
 *
 * @param product - The product data to analyze
 * @returns An array of Shopify metafield definitions
 * @throws Error if the AI call or parsing fails
 */
export async function mapToShopifyMetafields(
  product: MappingProductInput
): Promise<ShopifyMetafield[]> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are an expert at analyzing product data and creating Shopify metafield definitions.

Analyze the product information and generate relevant metafields for SEO and product enrichment.

Generate metafields for these namespaces:
- "custom" — for product-specific attributes (material, dimensions, weight, etc.)
- "seo" — for SEO-related metadata (focus_keyword, canonical_url, etc.)
- "descriptors" — for enhanced product descriptions (subtitle, care_instructions, etc.)

Metafield types to use:
- "single_line_text_field" — for short text values
- "multi_line_text_field" — for longer text
- "number_integer" — for whole numbers
- "number_decimal" — for decimal numbers
- "boolean" — for true/false
- "json" — for structured data
- "list.single_line_text_field" — for string arrays

Return a valid JSON array of objects, each with: namespace, key, value, type. No other text.`,
      messages: [
        {
          role: 'user',
          content: `Product Title: ${product.title}
Description: ${product.description}
Category: ${product.category ?? 'Unknown'}
Price: ${product.price ? `$${product.price}` : 'Unknown'}
Images: ${product.images?.length ?? 0} available`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response received from Claude');
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON array from mapper response');
    }

    return JSON.parse(jsonMatch[0]) as ShopifyMetafield[];
  } catch (error) {
    throw new Error(
      `Shopify metafields mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Category Suggestion
// ─────────────────────────────────────────────────────────────

/**
 * Uses Claude AI to suggest the most appropriate category path
 * for a product on the specified platform.
 *
 * @param product - The product data to categorize
 * @param platform - The target platform ('shopify' or 'ebay')
 * @returns The suggested category path as a string (e.g., "Electronics > Smartphones > Cases")
 * @throws Error if the AI call or parsing fails
 */
export async function suggestCategory(
  product: MappingProductInput,
  platform: MappingPlatform
): Promise<string> {
  try {
    const platformInstructions =
      platform === 'ebay'
        ? `Suggest the most specific eBay category path. Use eBay's category tree format: "Category > Subcategory > Sub-subcategory". Be as specific as possible to maximize search visibility in eBay's Cassini algorithm.`
        : `Suggest the most appropriate Shopify product type and collection path. Format: "Product Type: [type] | Collections: [collection1], [collection2]". Consider SEO-friendly naming.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: `You are an expert e-commerce product categorization specialist.

${platformInstructions}

Analyze the product title, description, and price to determine the best category.

Return ONLY the category path string. No other text, no quotes, no explanation.`,
      messages: [
        {
          role: 'user',
          content: `Product Title: ${product.title}
Description: ${product.description}
Category Hint: ${product.category ?? 'None'}
Price: ${product.price ? `$${product.price}` : 'Unknown'}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response received from Claude');
    }

    return textBlock.text.trim();
  } catch (error) {
    throw new Error(
      `Category suggestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
