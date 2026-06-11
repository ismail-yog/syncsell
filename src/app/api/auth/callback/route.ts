import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  // 1. Log everything eBay is sending back
  console.log('--- EBAY CALLBACK HIT ---');
  console.log('Query Params:', request.nextUrl.searchParams.toString());
  console.log('Cookies:', request.cookies.getAll());

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncsell-gmmk.vercel.app';

  try {
    if (error) {
      console.error('eBay Auth Error:', error, errorDescription);
      throw new Error(`eBay returned error: ${error} - ${errorDescription}`);
    }

    // 2. Make sure it explicitly tells us WHICH parameter is missing
    if (!code && !state) {
      throw new Error('Both authorization code and state are missing from eBay redirect.');
    }
    if (!code) {
      throw new Error('Authorization code is missing from eBay redirect.');
    }
    if (!state) {
      throw new Error('State parameter is missing from eBay redirect.');
    }

    // 3. State Validation
    if (!state.startsWith('ebay_auth:')) {
      throw new Error(`Invalid state parameter format received from eBay: ${state}`);
    }

    const userId = state.split(':')[1];
    if (!userId) {
      throw new Error('Could not extract User ID from state parameter.');
    }

    const clientId = process.env.EBAY_APP_ID;
    const clientSecret = process.env.EBAY_CERT_ID;
    const redirectUri = process.env.EBAY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing eBay API credentials in Vercel environment variables.');
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // 4. Token Exchange Request
    console.log('Attempting eBay Token Exchange...');
    const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('eBay Token Exchange Failed:', tokenData);
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange token with eBay API.');
    }

    console.log('Token Exchange Successful!');

    // Enterprise Architecture: Write token directly to the database via Service Role to completely bypass browser cookie issues
    console.log('Writing credentials directly to database via Admin Client...');
    
    const supabaseAdmin = createAdminClient();
    
    // Calculate expiration
    const expiresIn = tokenData.expires_in || 7200;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Bypass any missing ON CONFLICT constraints by using safe inserts and deletes
    await supabaseAdmin.from('users').insert({
      id: userId,
      email: 'ebay_oauth_user@syncsell.com', // Placeholder since we only have the ID here
      full_name: 'eBay Authenticated User'
    }).catch(() => {}); // Ignore duplicate errors

    // Clear old credentials
    await supabaseAdmin.from('store_credentials').delete().match({ user_id: userId, platform: 'ebay' });

    // Save new credentials
    const { error: dbError } = await supabaseAdmin
      .from('store_credentials')
      .insert({
        user_id: userId,
        platform: 'ebay',
        store_url: 'ebay.com',
        store_name: 'My eBay Store',
        encrypted_access_token: encrypt(tokenData.access_token),
        encrypted_refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        token_expires_at: expiresAt.toISOString(),
        is_active: true
      });

    if (dbError) {
      console.error('Admin Database Error:', dbError);
      throw new Error('Failed to save store credentials to database: ' + dbError.message);
    }

    console.log('Credentials saved successfully! Redirecting to Dashboard.');
    
    // Completely bypass the frontend handoff and go straight to success
    return NextResponse.redirect(new URL('/dashboard?success=ebay_connected', appUrl));

  } catch (err: any) {
    // 5. Wrap everything in try/catch and log the full error
    console.error('--- OAUTH CALLBACK EXCEPTION ---');
    console.error(err);
    
    // Redirect with the exact, explicit error message so you can see it on the dashboard
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(err.message || 'Unknown Callback Error')}`, appUrl));
  }
}
