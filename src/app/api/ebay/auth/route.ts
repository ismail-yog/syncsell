import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.EBAY_APP_ID;
  const redirectUri = process.env.EBAY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing eBay OAuth configuration' },
      { status: 500 }
    );
  }

  // Define the required scopes for EcomAutoPilot
  const scopes = [
    'https://api.ebay.com/oauth/api_scope',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.item',
  ].join(' ');

  // Construct the eBay Authorization URL
  const authUrl = new URL('https://auth.ebay.com/oauth2/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('state', 'ebay_auth');
  authUrl.searchParams.append('prompt', 'login');
  authUrl.searchParams.append('scope', scopes);

  // Redirect the user to eBay
  return NextResponse.redirect(authUrl.toString());
}
