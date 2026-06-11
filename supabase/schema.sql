-- EcomAutoPilot Secure Database Schema (Light/Pastel Version)
-- Run this in the Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- STORE CREDENTIALS (Secure Storage)
-- ============================================
CREATE TABLE public.store_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ebay')),
  store_url TEXT NOT NULL,
  store_name TEXT DEFAULT '',
  access_token TEXT NOT NULL, -- AES Encrypted
  refresh_token TEXT, -- AES Encrypted
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.store_credentials ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_store_credentials_user_id ON public.store_credentials(user_id);

CREATE POLICY "Users can view own credentials"
  ON public.store_credentials FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own credentials"
  ON public.store_credentials FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own credentials"
  ON public.store_credentials FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own credentials"
  ON public.store_credentials FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- PRODUCT LISTINGS
-- ============================================
CREATE TABLE public.product_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_credential_id UUID REFERENCES public.store_credentials(id) ON DELETE SET NULL,
  external_product_id TEXT, -- eBay Item ID
  
  -- Raw Data from eBay
  original_title TEXT NOT NULL,
  original_description TEXT,
  original_specifics JSONB DEFAULT '{}'::jsonb,
  price NUMERIC(10, 2),
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  
  -- Claude Optimized Data
  optimized_title TEXT,
  optimized_description TEXT,
  optimized_specifics JSONB DEFAULT '{}'::jsonb,
  pricing_suggestion NUMERIC(10, 2),
  pricing_rationale TEXT,
  
  -- Meta Data
  seo_score INTEGER DEFAULT 0,
  optimization_status TEXT DEFAULT 'pending' CHECK (optimization_status IN ('pending', 'processing', 'optimized', 'failed')),
  optimization_error TEXT,
  auto_publish_eligible BOOLEAN DEFAULT false,
  published_to_store BOOLEAN DEFAULT false,
  
  last_optimized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_listings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_product_listings_user_id ON public.product_listings(user_id);
CREATE INDEX idx_product_listings_status ON public.product_listings(optimization_status);

CREATE POLICY "Users can view own listings"
  ON public.product_listings FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own listings"
  ON public.product_listings FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own listings"
  ON public.product_listings FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own listings"
  ON public.product_listings FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Trigger to create user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
