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
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=missing_code`);
    }

    const supabase = await createClient();

    // Handle eBay OAuth Callback
    if (state === 'ebay_auth') {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(`${origin}/login?error=not_authenticated`);
      }

      // Exchange code for eBay token
      const authHeader = Buffer.from(
        `${process.env.EBAY_APP_ID}:${process.env.EBAY_CERT_ID}`
      ).toString('base64');

      const tokenResponse = await fetch(
        'https://api.ebay.com/identity/v1/oauth2/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${authHeader}`,
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.EBAY_REDIRECT_URI!,
          }),
        }
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('eBay Token Error:', errorData);
        return NextResponse.redirect(
          `${origin}/dashboard/inventory?error=ebay_connection_failed`
        );
      }

      const tokenData = await tokenResponse.json();

      // We must import the encryption utility dynamically to avoid circular issues
      // or we can import it at the top. Wait, we'll just import it at the top.
      // But we can require it here since it's an API route.
      const { encrypt } = await import('@/lib/encryption');

      const encryptedAccessToken = encrypt(tokenData.access_token);
      const encryptedRefreshToken = tokenData.refresh_token
        ? encrypt(tokenData.refresh_token)
        : null;

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

      // Save to Supabase store_credentials
      const { error: dbError } = await supabase.from('store_credentials').upsert(
        {
          user_id: user.id,
          platform: 'ebay',
          store_url: 'ebay.com', // Generic URL for eBay
          store_name: 'eBay Store', // Could be fetched from User profile API
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, platform' }
      );

      if (dbError) {
        console.error('Database Error saving eBay credential:', dbError);
        return NextResponse.redirect(
          `${origin}/dashboard/inventory?error=database_error`
        );
      }

      return NextResponse.redirect(
        `${origin}/dashboard/inventory?success=ebay_connected`
      );
    }

    // Default: Handle Supabase Auth Callback
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
