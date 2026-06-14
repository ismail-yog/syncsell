import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  console.log('--- EBAY SHADOW CALLBACK HIT ---');

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://syncsell-gmmk.vercel.app';

  try {
    if (error) {
      throw new Error(`eBay returned error: ${error}`);
    }
    if (!code || !state) {
      throw new Error('Missing code or state from eBay redirect.');
    }

    // 1. Verify CSRF State
    const cookieState = request.cookies.get('syncsell_auth_state')?.value;
    if (!cookieState || state !== `shadow_auth:${cookieState}`) {
      throw new Error('State parameter mismatch. Possible CSRF attack or expired session.');
    }

    // 2. Retrieve the Shadow Password
    const shadowPass = request.cookies.get('syncsell_shadow_pass')?.value;
    if (!shadowPass) {
      throw new Error('Missing shadow password. Session expired.');
    }

    const clientId = process.env.EBAY_APP_ID;
    const clientSecret = process.env.EBAY_CERT_ID;
    const redirectUri = process.env.EBAY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing eBay API credentials.');
    }

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // 3. Exchange Token
    console.log('Exchanging eBay code for token...');
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
      throw new Error(tokenData.error_description || 'Failed to exchange token with eBay API.');
    }

    // 4. Fetch User Identity from eBay
    console.log('Fetching eBay User Identity...');
    const identityResponse = await fetch('https://api.ebay.com/commerce/identity/v1/user/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    const identityData = await identityResponse.json();
    if (!identityResponse.ok) {
      throw new Error(identityData.error_description || 'Failed to fetch eBay identity.');
    }

    const ebayUserId = identityData.userId;
    const ebayEmail = identityData.account?.email || `ebay_${ebayUserId}@syncsell.com`;
    const ebayName = identityData.individualAccount?.firstName 
      ? `${identityData.individualAccount.firstName} ${identityData.individualAccount.lastName}`
      : (identityData.businessAccount?.businessName || ebayUserId);

    console.log(`Resolved Identity: ${ebayEmail} (${ebayName})`);

    const supabaseAdmin = createAdminClient();
    let supabaseUserId = '';

    // 5. Create or Update Shadow Account using Admin API
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error('Failed to query users via Admin API: ' + listError.message);
    }

    const existingUser = existingUsers.users.find(u => u.email === ebayEmail);

    if (existingUser) {
      console.log('User exists. Updating shadow password...');
      supabaseUserId = existingUser.id;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
        password: shadowPass,
        email_confirm: true
      });
      if (updateError) throw new Error('Failed to update shadow password: ' + updateError.message);
    } else {
      console.log('Creating new shadow account...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ebayEmail,
        password: shadowPass,
        email_confirm: true,
        user_metadata: { full_name: ebayName }
      });
      if (createError || !newUser.user) throw new Error('Failed to create shadow user: ' + (createError?.message || 'No user returned'));
      supabaseUserId = newUser.user.id;
      
      // Seed public.users table
      await supabaseAdmin.from('users').insert({
        id: supabaseUserId,
        email: ebayEmail,
        full_name: ebayName
      });
    }

    // 6. Sign in the User (Creates the secure session cookies)
    console.log('Signing in shadow account...');
    const supabaseClient = await createClient(); // The server client handles cookies
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: ebayEmail,
      password: shadowPass
    });

    if (signInError) {
      throw new Error('Failed to sign in shadow account: ' + signInError.message);
    }

    // 7. Save eBay Credentials
    console.log('Saving store credentials...');
    const expiresIn = tokenData.expires_in || 7200;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    await supabaseAdmin.from('store_credentials').delete().match({ user_id: supabaseUserId, platform: 'ebay' });
    
    const { error: dbError } = await supabaseAdmin.from('store_credentials').insert({
      user_id: supabaseUserId,
      platform: 'ebay',
      store_url: 'ebay.com',
      store_name: ebayName,
      encrypted_access_token: encrypt(tokenData.access_token),
      encrypted_refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
      token_expires_at: expiresAt.toISOString(),
      is_active: true
    });

    if (dbError) throw new Error('Failed to save credentials: ' + dbError.message);

    // 8. Redirect to Dashboard & clean up temporary cookies
    console.log('Success! Redirecting to dashboard.');
    const response = NextResponse.redirect(new URL('/dashboard?success=ebay_connected', appUrl));
    response.cookies.delete('syncsell_shadow_pass');
    response.cookies.delete('syncsell_auth_state');
    return response;

  } catch (err: any) {
    console.error('--- SHADOW AUTH CALLBACK EXCEPTION ---');
    console.error(err);
    
    // Fallback: If anything fails, send them back with the exact error so we can debug
    const response = NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message || 'Unknown Shadow Auth Error')}`, appUrl));
    response.cookies.delete('syncsell_shadow_pass');
    response.cookies.delete('syncsell_auth_state');
    return response;
  }
}
