/**
 * Supported e-commerce platforms.
 */
export type Platform = 'shopify' | 'ebay';

/**
 * Status of a product listing's SEO optimization workflow.
 */
export type OptimizationStatus =
  | 'pending'
  | 'processing'
  | 'optimized'
  | 'failed'
  | 'pushed';

/**
 * Status of an inventory synchronization attempt.
 */
export type SyncStatus = 'success' | 'failed' | 'pending';

/**
 * Status of an SEO optimization log entry.
 */
export type SEOLogStatus = 'accepted' | 'retry' | 'failed';

/**
 * Role of a participant in a chat conversation.
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Subscription tier levels for users.
 */
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// ─────────────────────────────────────────────────────────────
// Core entities
// ─────────────────────────────────────────────────────────────

/**
 * Application user profile stored in the users table.
 */
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

/**
 * Encrypted credentials for a connected e-commerce store.
 */
export interface StoreCredential {
  id: string;
  user_id: string;
  platform: Platform;
  store_url: string;
  store_name: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * A product listing aggregated from a connected store,
 * with original and SEO-optimized content.
 */
export interface ProductListing {
  id: string;
  user_id: string;
  store_credential_id: string;
  platform: Platform;
  external_product_id: string;
  sku: string | null;
  original_title: string;
  optimized_title: string | null;
  original_description: string | null;
  optimized_description: string | null;
  original_bullet_points: string[];
  optimized_bullet_points: string[];
  original_category: string | null;
  mapped_category: string | null;
  item_specifics: Record<string, string>;
  seo_score: number | null;
  optimization_status: OptimizationStatus;
  optimization_attempts: number;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  images: string[];
  embedding: number[] | null;
  last_optimized_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Log entry for an inventory synchronization event between platforms.
 */
export interface InventorySyncLog {
  id: string;
  user_id: string;
  source_platform: Platform;
  source_sku: string;
  target_platform: Platform;
  target_sku: string;
  previous_quantity: number;
  new_quantity: number;
  sync_status: SyncStatus;
  error_message: string | null;
  created_at: string;
}

/**
 * Log entry for an SEO optimization attempt on a product listing.
 */
export interface SEOOptimizationLog {
  id: string;
  product_listing_id: string;
  user_id: string;
  platform: Platform;
  attempt_number: number;
  original_title: string;
  generated_title: string;
  generated_description: string;
  generated_bullet_points: string[];
  generated_item_specifics: Record<string, string>;
  seo_score: number;
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  status: SEOLogStatus;
  created_at: string;
}

/**
 * A tracked competitor listing for price comparison and alerts.
 */
export interface CompetitorTracking {
  id: string;
  user_id: string;
  product_listing_id: string;
  competitor_url: string;
  competitor_title: string | null;
  competitor_price: number | null;
  user_price: number | null;
  price_difference: number | null;
  is_undercut: boolean;
  alert_acknowledged: boolean;
  last_checked_at: string | null;
  created_at: string;
}

/**
 * A single message in the AI chat assistant conversation.
 */
export interface ChatLog {
  id: string;
  user_id: string;
  session_id: string;
  role: ChatRole;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/**
 * Aggregated dashboard statistics for a user's account.
 */
export interface DashboardStats {
  total_products: number;
  optimized_products: number;
  avg_seo_score: number;
  active_alerts: number;
  products_processing: number;
  total_syncs_today: number;
}
