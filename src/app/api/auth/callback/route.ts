import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/callback
 *
 * Handles the OAuth callback from Supabase Auth.
 * Exchanges the authorization code for a session and redirects
 * the user to the dashboard on success, or to /login on failure.
 *
 * @param request - The incoming request with `code` search parameter
 * @returns A redirect response to /dashboard or /login
 */
export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error.message);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error) {
    console.error(
      'Auth callback exception:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }
}
