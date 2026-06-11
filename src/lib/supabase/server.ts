import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client configured for server-side usage.
 * Handles cookie operations for authentication state management.
 * setAll is wrapped in try/catch for Server Component safety where
 * cookies cannot be modified.
 *
 * @returns A Promise resolving to a Supabase server client instance
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from a Server Component where cookies
            // cannot be modified. This is safe to ignore when the middleware
            // is correctly refreshing user sessions.
          }
        },
      },
    }
  );
}
