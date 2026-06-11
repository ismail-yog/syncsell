import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(
        '<html><body><h1>Error: You are not logged in.</h1><p>Please log in to the dashboard first, then click this link again.</p></body></html>',
        { status: 401, headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Ensure user exists in public.users
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Manual Inject User'
    }, { onConflict: 'id' });

    // The raw eBay User Token provided by the user
    const rawToken = 'v^1.1#i^1#p^3#I^3#r^0#f^0#t^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';

    // Calculate expiration (e.g. 2 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    // Bypass missing UNIQUE constraints by deleting the old credential first
    await supabase.from('store_credentials').delete().match({ user_id: user.id, platform: 'ebay' });

    // Encrypt and inject the real token into store_credentials using simple insert
    const { error: storeError } = await supabase.from('store_credentials').insert({
      user_id: user.id,
      platform: 'ebay',
      store_url: 'ebay.com',
      store_name: 'My Actual eBay Store',
      encrypted_access_token: encrypt(rawToken),
      token_expires_at: expiresAt.toISOString(),
      is_active: true
    });

    if (storeError) {
      throw new Error(storeError.message);
    }

    return new NextResponse(
      '<html><body style="font-family: sans-serif; text-align: center; padding: 50px; background: #f0fdf4;">' +
      '<h1 style="color: #166534; font-size: 3rem;">SUCCESS!</h1>' +
      '<p style="font-size: 1.5rem;">Your real eBay token has been manually securely injected into the database.</p>' +
      '<a href="/dashboard" style="display: inline-block; margin-top: 20px; padding: 15px 30px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>' +
      '</body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );

  } catch (err: any) {
    console.error('Manual Inject Error:', err);
    return new NextResponse(
      `<html><body><h1>Injection Failed</h1><p>${err.message}</p></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}
