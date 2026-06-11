-- ═══════════════════════════════════════════════════════════════
-- EcomAutoPilot v2.0 — Complete PostgreSQL Schema
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─────────────────────────────────────────────────────────────
-- Auto-update trigger function
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
                CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert_own ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_delete_own ON users
  FOR DELETE USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────
-- Store Credentials
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS store_credentials (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform                TEXT NOT NULL CHECK (platform IN ('shopify', 'ebay')),
  store_url               TEXT NOT NULL,
  store_name              TEXT NOT NULL,
  encrypted_access_token  TEXT NOT NULL,
  encrypted_refresh_token TEXT,
  token_expires_at        TIMESTAMPTZ,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  metadata                JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_store_credentials_user_platform_url
    UNIQUE (user_id, platform, store_url)
);

CREATE INDEX idx_store_credentials_user_id ON store_credentials (user_id);
CREATE INDEX idx_store_credentials_platform ON store_credentials (platform);

CREATE TRIGGER trg_store_credentials_updated_at
  BEFORE UPDATE ON store_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE store_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY store_credentials_select_own ON store_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY store_credentials_insert_own ON store_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY store_credentials_update_own ON store_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY store_credentials_delete_own ON store_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Product Listings
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_listings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_credential_id   UUID NOT NULL REFERENCES store_credentials(id) ON DELETE CASCADE,
  platform              TEXT NOT NULL CHECK (platform IN ('shopify', 'ebay')),
  external_product_id   TEXT NOT NULL,
  sku                   TEXT,
  original_title        TEXT NOT NULL,
  optimized_title       TEXT,
  original_description  TEXT,
  optimized_description TEXT,
  original_bullet_points TEXT[] DEFAULT '{}',
  optimized_bullet_points TEXT[] DEFAULT '{}',
  original_category     TEXT,
  mapped_category       TEXT,
  item_specifics        JSONB DEFAULT '{}',
  seo_score             REAL,
  optimization_status   TEXT NOT NULL DEFAULT 'pending'
                        CHECK (optimization_status IN (
                          'pending', 'processing', 'optimized', 'failed', 'pushed'
                        )),
  optimization_attempts INTEGER NOT NULL DEFAULT 0,
  price                 NUMERIC(12, 2),
  currency              TEXT DEFAULT 'USD',
  image_url             TEXT,
  images                TEXT[] DEFAULT '{}',
  embedding             vector(1536),
  last_optimized_at     TIMESTAMPTZ,
  last_synced_at        TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_listings_user_id ON product_listings (user_id);
CREATE INDEX idx_product_listings_platform ON product_listings (platform);
CREATE INDEX idx_product_listings_optimization_status ON product_listings (optimization_status);
CREATE INDEX idx_product_listings_sku ON product_listings (sku);
CREATE INDEX idx_product_listings_store_external ON product_listings (store_credential_id, external_product_id);

CREATE TRIGGER trg_product_listings_updated_at
  BEFORE UPDATE ON product_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE product_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_listings_select_own ON product_listings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY product_listings_insert_own ON product_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY product_listings_update_own ON product_listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY product_listings_delete_own ON product_listings
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Inventory Sync Logs
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory_sync_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_platform   TEXT NOT NULL CHECK (source_platform IN ('shopify', 'ebay')),
  source_sku        TEXT NOT NULL,
  target_platform   TEXT NOT NULL CHECK (target_platform IN ('shopify', 'ebay')),
  target_sku        TEXT NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity      INTEGER NOT NULL,
  sync_status       TEXT NOT NULL DEFAULT 'pending'
                    CHECK (sync_status IN ('success', 'failed', 'pending')),
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_sync_logs_user_id ON inventory_sync_logs (user_id);

ALTER TABLE inventory_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_sync_logs_select_own ON inventory_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY inventory_sync_logs_insert_own ON inventory_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY inventory_sync_logs_update_own ON inventory_sync_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY inventory_sync_logs_delete_own ON inventory_sync_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- SEO Optimization Logs
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_optimization_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_listing_id    UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform              TEXT NOT NULL CHECK (platform IN ('shopify', 'ebay')),
  attempt_number        INTEGER NOT NULL DEFAULT 1,
  original_title        TEXT NOT NULL,
  generated_title       TEXT NOT NULL,
  generated_description TEXT NOT NULL,
  generated_bullet_points TEXT[] DEFAULT '{}',
  generated_item_specifics JSONB DEFAULT '{}',
  seo_score             REAL NOT NULL,
  model_used            TEXT NOT NULL,
  prompt_tokens         INTEGER NOT NULL DEFAULT 0,
  completion_tokens     INTEGER NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'accepted'
                        CHECK (status IN ('accepted', 'retry', 'failed')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seo_optimization_logs_product_id ON seo_optimization_logs (product_listing_id);
CREATE INDEX idx_seo_optimization_logs_user_id ON seo_optimization_logs (user_id);

ALTER TABLE seo_optimization_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY seo_optimization_logs_select_own ON seo_optimization_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY seo_optimization_logs_insert_own ON seo_optimization_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY seo_optimization_logs_update_own ON seo_optimization_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY seo_optimization_logs_delete_own ON seo_optimization_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Competitor Tracking
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS competitor_tracking (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_listing_id  UUID NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
  competitor_url      TEXT NOT NULL,
  competitor_title    TEXT,
  competitor_price    NUMERIC(12, 2),
  user_price          NUMERIC(12, 2),
  price_difference    NUMERIC(12, 2),
  is_undercut         BOOLEAN NOT NULL DEFAULT FALSE,
  alert_acknowledged  BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competitor_tracking_user_id ON competitor_tracking (user_id);
CREATE INDEX idx_competitor_tracking_product_id ON competitor_tracking (product_listing_id);

ALTER TABLE competitor_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_tracking_select_own ON competitor_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY competitor_tracking_insert_own ON competitor_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY competitor_tracking_update_own ON competitor_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY competitor_tracking_delete_own ON competitor_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Chat Logs
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  message     TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_logs_user_id ON chat_logs (user_id);
CREATE INDEX idx_chat_logs_session_id ON chat_logs (session_id);

ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_logs_select_own ON chat_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY chat_logs_insert_own ON chat_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY chat_logs_update_own ON chat_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY chat_logs_delete_own ON chat_logs
  FOR DELETE USING (auth.uid() = user_id);
