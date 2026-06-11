import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt, encrypt } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Authenticate the user securely
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the handoff cookie that was securely set by the callback route
    const handoffCookie = request.cookies.get('ebay_oauth_handoff')?.value;
    
    if (!handoffCookie) {
      return NextResponse.json({ error: 'No eBay handoff token found. The session may have expired.' }, { status: 400 });
    }

    let handoffData;
    try {
      handoffData = JSON.parse(decrypt(handoffCookie));
    } catch (e) {
      return NextResponse.json({ error: 'Invalid handoff token' }, { status: 400 });
    }

    const { tokenData, userId } = handoffData;

    if (userId !== user.id) {
      return NextResponse.json({ error: 'User mismatch during handoff' }, { status: 403 });
    }

    // Calculate expiration
    const expiresIn = tokenData.expires_in || 7200; // usually 7200 seconds (2 hours)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Save or update the store credentials in Supabase
    const { error: dbError } = await supabase
      .from('store_credentials')
      .upsert({
        user_id: user.id,
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
      console.error('Database Error during finalization:', dbError);
      return NextResponse.json({ error: 'Failed to save store credentials to database' }, { status: 500 });
    }

    // Successfully connected! Return success and clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('ebay_oauth_handoff');
    return response;

  } catch (err: any) {
    console.error('OAuth Finalization Exception:', err);
    return NextResponse.json({ error: err.message || 'Unknown Error' }, { status: 500 });
  }
}
