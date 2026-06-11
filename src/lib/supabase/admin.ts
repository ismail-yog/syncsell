import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client with the service role key.
 * This client bypasses Row Level Security (RLS) and should only
 * be used in trusted server-side contexts (webhooks, background jobs, etc.).
 *
 * @returns A Supabase admin client instance
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
