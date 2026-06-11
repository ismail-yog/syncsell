import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

    // OAUTH HANDOFF PATTERN:
    // Because cross-site redirects (eBay -> Vercel) drop cookies, we cannot save to the database here
    // because Supabase requires your login cookies to bypass Row Level Security.
    // Instead, we encrypt the eBay token, save it in a secure SameSite=Lax cookie on our own domain,
    // and redirect you back to the Dashboard. 
    // The Dashboard will then read the cookie and save it to the database with your full login session!
    
    const handoffData = {
      userId: userId,
      tokenData: tokenData
    };
    
    const response = NextResponse.redirect(new URL('/dashboard?finalize_ebay=true', appUrl));
    
    // Set a temporary cookie that expires in 5 minutes
    response.cookies.set('ebay_oauth_handoff', encrypt(JSON.stringify(handoffData)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
      path: '/'
    });
    
    return response;

  } catch (err: any) {
    console.error('OAuth Callback Exception:', err);
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(err.message || 'Unknown Error')}`, appUrl));
  }
}
