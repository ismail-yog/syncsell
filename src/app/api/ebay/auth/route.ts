import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const clientId = process.env.EBAY_APP_ID;
  const redirectUri = process.env.EBAY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing eBay OAuth configuration' },
      { status: 500 }
    );
  }

  // Get current user to pass in state (bypasses cross-site cookie drops on callback)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=not_authenticated', process.env.NEXT_PUBLIC_APP_URL || 'https://syncsell-gmmk.vercel.app'));
  }

  // Define the required scopes for EcomAutoPilot (Matching user's enterprise allowed scopes)
  const scopes = [
    'https://api.ebay.com/oauth/api_scope',
    'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.marketing',
    'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.account',
    'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
    'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.finances',
    'https://api.ebay.com/oauth/api_scope/sell.payment.dispute',
    'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.reputation',
    'https://api.ebay.com/oauth/api_scope/sell.reputation.readonly',
    'https://api.ebay.com/oauth/api_scope/commerce.notification.subscription',
    'https://api.ebay.com/oauth/api_scope/commerce.notification.subscription.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.stores',
    'https://api.ebay.com/oauth/api_scope/sell.stores.readonly',
    'https://api.ebay.com/oauth/scope/sell.edelivery',
    'https://api.ebay.com/oauth/api_scope/commerce.vero',
    'https://api.ebay.com/oauth/api_scope/sell.inventory.mapping',
    'https://api.ebay.com/oauth/api_scope/commerce.message',
    'https://api.ebay.com/oauth/api_scope/commerce.feedback',
    'https://api.ebay.com/oauth/api_scope/commerce.shipping'
  ].join(' ');

  // Construct the eBay Authorization URL
  const authUrl = new URL('https://auth.ebay.com/oauth2/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', `ebay_auth:${user.id}`);
  authUrl.searchParams.append('prompt', 'login');
  authUrl.searchParams.append('scope', scopes);

  // Redirect the user to eBay
  return NextResponse.redirect(authUrl.toString());
}
