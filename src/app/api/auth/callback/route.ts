import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncsell-gmmk.vercel.app';

  if (error) {
    console.error('eBay Auth Error:', error, errorDescription);
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(errorDescription || 'eBay Auth Failed')}`, appUrl));
  }

  if (!code || !state || !state.startsWith('ebay_auth:')) {
    return NextResponse.redirect(new URL('/dashboard?error=Missing+Auth+Parameters', appUrl));
  }

  const userId = state.split(':')[1];
  
  if (!userId) {
    return NextResponse.redirect(new URL('/dashboard?error=Invalid+State+Parameter', appUrl));
  }

  try {
    const clientId = process.env.EBAY_APP_ID;
    const clientSecret = process.env.EBAY_CERT_ID;
    const redirectUri = process.env.EBAY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing eBay API credentials');
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Exchange the authorization code for an access token
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
      console.error('eBay Token Error:', tokenData);
      throw new Error(tokenData.error_description || 'Failed to exchange token');
    }

    const supabase = await createClient();
    
    // BUGFIX: Ensure the user exists in the public.users table!
    // Supabase auth.users doesn't automatically sync to public.users without a trigger.
    // If public.users is empty, the store_credentials foreign key constraint throws an error!
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || ''
      }, { onConflict: 'id' });
    }
    
    // Calculate expiration
    const expiresIn = tokenData.expires_in || 7200; // usually 7200 seconds (2 hours)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Save or update the store credentials in Supabase
    // We are encrypting the tokens so they are secure at rest
    const { error: dbError } = await supabase
      .from('store_credentials')
      .upsert({
        user_id: userId,
        platform: 'ebay',
        store_url: 'ebay.com', // eBay doesn't provide a specific store URL on standard auth
        store_name: 'My eBay Store',
        access_token: encrypt(tokenData.access_token),
        refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
        token_expires_at: expiresAt.toISOString(),
        is_active: true
      }, {
        onConflict: 'user_id, platform'
      });

    if (dbError) {
      console.error('Database Error:', dbError);
      throw new Error('Failed to save store credentials');
    }

    // Successfully connected! Redirect back to dashboard
    return NextResponse.redirect(new URL('/dashboard?success=ebay_connected', appUrl));

  } catch (err: any) {
    console.error('OAuth Callback Exception:', err);
    
    // Log to Supabase so Antigravity can read it
    try {
      const supabase = await createClient();
      await supabase.from('chat_logs').insert({
        user_id: userId,
        session_id: 'error_log',
        role: 'system',
        message: 'OAUTH_ERROR',
        metadata: { error: err.message, stack: err.stack }
      });
    } catch (dbLogErr) {
      // Ignore
    }

    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(err.message || 'Unknown Error')}`, appUrl));
  }
}
