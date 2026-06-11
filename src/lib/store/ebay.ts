import { createHmac } from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** eBay inventory item product details. */
interface EbayProduct {
  title: string;
  description: string;
  aspects: Record<string, string[]>;
  brand: string;
  mpn: string;
  imageUrls: string[];
  upc?: string[];
}

/** eBay inventory item availability. */
interface EbayAvailability {
  shipToLocationAvailability: {
    quantity: number;
  };
}

/** eBay inventory item resource. */
export interface EbayInventoryItem {
  sku: string;
  locale: string;
  product: EbayProduct;
  condition: string;
  conditionDescription?: string;
  availability: EbayAvailability;
}

/** eBay inventory items paginated response. */
interface EbayInventoryItemsResponse {
  inventoryItems: EbayInventoryItem[];
  total: number;
  size: number;
  offset: number;
}

/** eBay offer pricing. */
interface EbayPricingSummary {
  price: {
    value: string;
    currency: string;
  };
}

/** eBay offer resource. */
export interface EbayOffer {
  offerId: string;
  sku: string;
  marketplaceId: string;
  format: string;
  listingDescription: string;
  pricingSummary: EbayPricingSummary;
  quantityLimitPerBuyer?: number;
  status: string;
}

/** eBay offers response. */
interface EbayOffersResponse {
  offers: EbayOffer[];
  total: number;
  size: number;
  offset: number;
}

/** Data to create or replace an inventory item. */
export interface EbayInventoryItemInput {
  product: {
    title: string;
    description: string;
    aspects?: Record<string, string[]>;
    brand?: string;
    mpn?: string;
    imageUrls?: string[];
    upc?: string[];
  };
  condition: string;
  conditionDescription?: string;
  availability: {
    shipToLocationAvailability: {
      quantity: number;
    };
  };
}

/** Data to update an existing offer. */
export interface EbayOfferUpdate {
  listingDescription?: string;
  pricingSummary?: EbayPricingSummary;
  quantityLimitPerBuyer?: number;
}

/** OAuth token refresh response. */
interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// ─────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────

/**
 * eBay RESTful API client for inventory management and offer operations.
 * Supports both production and sandbox environments.
 */
export class EbayClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  /**
   * Creates a new EbayClient instance.
   *
   * @param accessToken - The eBay OAuth2 access token
   * @param sandbox - Whether to use the eBay sandbox environment (default: false)
   */
  constructor(accessToken: string, sandbox: boolean = false) {
    this.baseUrl = sandbox
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';
    this.headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Content-Language': 'en-US',
    };
  }

  /**
   * Internal fetch helper for eBay API requests.
   *
   * @param endpoint - The API endpoint path
   * @param options - Fetch options
   * @returns The parsed JSON response (or null for 204 No Content)
   * @throws Error on non-OK responses
   */
  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...(options.headers as Record<string, string>),
      },
    });

    // 204 No Content is a success for create/replace operations
    if (response.status === 204) {
      return null as T;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`eBay API error ${response.status}: ${errorBody}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Fetches a paginated list of inventory items.
   *
   * @param limit - Number of items per page (default: 25, max: 100)
   * @param offset - Pagination offset (default: 0)
   * @returns Paginated inventory items response
   */
  async getInventoryItems(
    limit: number = 25,
    offset: number = 0
  ): Promise<EbayInventoryItemsResponse> {
    return this.fetchApi<EbayInventoryItemsResponse>(
      `/sell/inventory/v1/inventory_item?limit=${Math.min(limit, 100)}&offset=${offset}`
    );
  }

  /**
   * Fetches a single inventory item by its SKU.
   *
   * @param sku - The inventory item SKU
   * @returns The inventory item resource
   */
  async getInventoryItem(sku: string): Promise<EbayInventoryItem> {
    return this.fetchApi<EbayInventoryItem>(
      `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`
    );
  }

  /**
   * Creates or replaces an inventory item identified by SKU.
   * If the SKU already exists, the item is fully replaced.
   *
   * @param sku - The SKU identifier for the inventory item
   * @param data - The inventory item data to create or replace with
   */
  async createOrReplaceInventoryItem(
    sku: string,
    data: EbayInventoryItemInput
  ): Promise<void> {
    await this.fetchApi<null>(
      `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Updates an existing offer (live listing) by its offer ID.
   *
   * @param offerId - The eBay offer ID
   * @param data - The offer fields to update
   */
  async updateOffer(offerId: string, data: EbayOfferUpdate): Promise<void> {
    await this.fetchApi<null>(`/sell/inventory/v1/offer/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Retrieves all offers associated with a specific SKU.
   *
   * @param sku - The SKU to query offers for
   * @returns Paginated offers response
   */
  async getOffers(sku: string): Promise<EbayOffersResponse> {
    return this.fetchApi<EbayOffersResponse>(
      `/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}`
    );
  }

  /**
   * Refreshes an eBay OAuth2 access token using a refresh token.
   * This is a static method that doesn't require an existing client instance.
   *
   * @param refreshToken - The OAuth2 refresh token
   * @param clientId - The eBay application client ID
   * @param clientSecret - The eBay application client secret
   * @param sandbox - Whether to use the sandbox environment (default: false)
   * @returns The new access token and expiration details
   * @throws Error if the token refresh request fails
   */
  static async refreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    sandbox: boolean = false
  ): Promise<EbayTokenResponse> {
    const tokenUrl = sandbox
      ? 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
      : 'https://api.ebay.com/identity/v1/oauth2/token';

    const credentials = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString('base64');

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `eBay token refresh failed (${response.status}): ${errorBody}`
      );
    }

    return (await response.json()) as EbayTokenResponse;
  }

  /**
   * Verifies an eBay push notification signature.
   * Used to validate that incoming webhook payloads are genuinely from eBay.
   *
   * @param signature - The signature from the notification headers
   * @param body - The raw notification body
   * @param verificationToken - The eBay notification verification token
   * @returns True if the signature is valid
   */
  static verifyNotification(
    signature: string,
    body: string,
    verificationToken: string
  ): boolean {
    try {
      const expectedSignature = createHmac('sha256', verificationToken)
        .update(body)
        .digest('base64');

      // Timing-safe comparison via buffer comparison
      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      let result = 0;
      for (let i = 0; i < sigBuffer.length; i++) {
        result |= sigBuffer[i] ^ expectedBuffer[i];
      }

      return result === 0;
    } catch {
      return false;
    }
  }
}
