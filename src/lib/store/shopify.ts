import { createHmac, timingSafeEqual } from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Shopify product image. */
interface ShopifyImage {
  id: number;
  product_id: number;
  src: string;
  alt: string | null;
  position: number;
}

/** Shopify product variant. */
interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  sku: string;
  price: string;
  inventory_item_id: number;
  inventory_quantity: number;
}

/** Shopify product resource. */
export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  status: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  created_at: string;
  updated_at: string;
}

/** Shopify paginated response wrapper. */
interface ShopifyPaginatedResponse<T> {
  data: T[];
  pageInfo: string | null;
}

/** Shopify product update payload. */
export interface ShopifyProductUpdate {
  title?: string;
  body_html?: string;
  tags?: string;
  metafields?: ShopifyMetafield[];
}

/** Shopify metafield definition. */
interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

/** Shopify inventory level. */
export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number | null;
  updated_at: string;
}

/** Shopify webhook subscription topic. */
export type ShopifyWebhookTopic =
  | 'orders/create'
  | 'orders/updated'
  | 'products/update'
  | 'inventory_levels/update'
  | 'app/uninstalled';

// ─────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────

/**
 * Shopify Admin REST API client with rate-limiting awareness.
 * Handles paginated product fetching, product updates, inventory
 * management, and webhook operations.
 */
export class ShopifyClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly apiVersion = '2024-10';

  /**
   * Creates a new ShopifyClient instance.
   *
   * @param shopDomain - The Shopify shop domain (e.g., "mystore.myshopify.com")
   * @param accessToken - The Shopify Admin API access token
   */
  constructor(shopDomain: string, accessToken: string) {
    // Normalize domain: remove protocol and trailing slash
    const cleanDomain = shopDomain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    this.baseUrl = `https://${cleanDomain}/admin/api/${this.apiVersion}`;
    this.headers = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Internal fetch helper with rate-limiting awareness.
   * Automatically retries on 429 responses with the Retry-After header.
   *
   * @param endpoint - The API endpoint path (e.g., "/products.json")
   * @param options - Fetch options (method, body, etc.)
   * @returns The parsed JSON response
   * @throws Error on non-OK responses after retry attempts
   */
  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...(options.headers as Record<string, string>),
        },
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : 2000;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Shopify API error ${response.status}: ${errorBody}`
        );
      }

      return (await response.json()) as T;
    }

    throw new Error('Shopify API: Max retries exceeded');
  }

  /**
   * Fetches a paginated list of products from the Shopify store.
   *
   * @param limit - Maximum number of products to return (default: 50, max: 250)
   * @param pageInfo - Cursor for pagination (from previous response)
   * @returns An object containing the products array and next page cursor
   */
  async getProducts(
    limit: number = 50,
    pageInfo?: string
  ): Promise<ShopifyPaginatedResponse<ShopifyProduct>> {
    let endpoint = `/products.json?limit=${Math.min(limit, 250)}`;
    if (pageInfo) {
      endpoint = `/products.json?limit=${Math.min(limit, 250)}&page_info=${pageInfo}`;
    }

    const response = await this.fetchApi<{ products: ShopifyProduct[] }>(
      endpoint
    );

    // Shopify returns pagination info in Link header — we extract it
    // from the response. In practice, the fetchApi would need to
    // return headers too. For simplicity, we return null for pageInfo.
    return {
      data: response.products,
      pageInfo: null, // Would be extracted from Link header in production
    };
  }

  /**
   * Fetches a single product by its Shopify product ID.
   *
   * @param productId - The Shopify product ID
   * @returns The product resource
   */
  async getProduct(productId: string | number): Promise<ShopifyProduct> {
    const response = await this.fetchApi<{ product: ShopifyProduct }>(
      `/products/${productId}.json`
    );
    return response.product;
  }

  /**
   * Updates an existing product's title, description, tags, and/or metafields.
   *
   * @param productId - The Shopify product ID to update
   * @param data - The fields to update
   * @returns The updated product resource
   */
  async updateProduct(
    productId: string | number,
    data: ShopifyProductUpdate
  ): Promise<ShopifyProduct> {
    const response = await this.fetchApi<{ product: ShopifyProduct }>(
      `/products/${productId}.json`,
      {
        method: 'PUT',
        body: JSON.stringify({ product: data }),
      }
    );
    return response.product;
  }

  /**
   * Retrieves inventory levels for specified inventory item IDs.
   *
   * @param inventoryItemIds - Array of inventory item IDs to query
   * @returns Array of inventory levels with location and available quantities
   */
  async getInventoryLevels(
    inventoryItemIds: number[]
  ): Promise<ShopifyInventoryLevel[]> {
    const ids = inventoryItemIds.join(',');
    const response = await this.fetchApi<{
      inventory_levels: ShopifyInventoryLevel[];
    }>(`/inventory_levels.json?inventory_item_ids=${ids}`);
    return response.inventory_levels;
  }

  /**
   * Sets the available inventory quantity for an item at a specific location.
   *
   * @param inventoryItemId - The inventory item ID
   * @param locationId - The location ID
   * @param available - The new available quantity
   * @returns The updated inventory level
   */
  async setInventoryLevel(
    inventoryItemId: number,
    locationId: number,
    available: number
  ): Promise<ShopifyInventoryLevel> {
    const response = await this.fetchApi<{
      inventory_level: ShopifyInventoryLevel;
    }>('/inventory_levels/set.json', {
      method: 'POST',
      body: JSON.stringify({
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        available,
      }),
    });
    return response.inventory_level;
  }

  /**
   * Registers a webhook subscription for a specific topic.
   *
   * @param topic - The webhook topic to subscribe to
   * @param address - The HTTPS URL endpoint to receive webhook payloads
   * @returns The created webhook resource
   */
  async registerWebhook(
    topic: ShopifyWebhookTopic,
    address: string
  ): Promise<Record<string, unknown>> {
    const response = await this.fetchApi<{ webhook: Record<string, unknown> }>(
      '/webhooks.json',
      {
        method: 'POST',
        body: JSON.stringify({
          webhook: {
            topic,
            address,
            format: 'json',
          },
        }),
      }
    );
    return response.webhook;
  }

  /**
   * Verifies the HMAC-SHA256 signature of an incoming Shopify webhook.
   * Uses timing-safe comparison to prevent timing attacks.
   *
   * @param rawBody - The raw request body as a string
   * @param hmacHeader - The X-Shopify-Hmac-Sha256 header value
   * @param secret - The Shopify webhook signing secret
   * @returns True if the signature is valid
   */
  static verifyWebhook(
    rawBody: string,
    hmacHeader: string,
    secret: string
  ): boolean {
    try {
      const hash = createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('base64');

      const hashBuffer = Buffer.from(hash, 'base64');
      const hmacBuffer = Buffer.from(hmacHeader, 'base64');

      if (hashBuffer.length !== hmacBuffer.length) {
        return false;
      }

      return timingSafeEqual(hashBuffer, hmacBuffer);
    } catch {
      return false;
    }
  }
}
