import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch the user's encrypted eBay token
    const { data: storeCreds, error: credError } = await supabase
      .from('store_credentials')
      .select('id, encrypted_access_token')
      .eq('user_id', user.id)
      .eq('platform', 'ebay')
      .single();

    if (credError || !storeCreds) {
      return NextResponse.json({ error: 'eBay store not connected' }, { status: 400 });
    }

    // 2. Decrypt the access token
    const accessToken = decrypt(storeCreds.encrypted_access_token);

    // 3. Call eBay's Inventory API (Trading API or Inventory API, here using Inventory API)
    // For standard eBay sellers, the Sell Inventory API requires opting into eBay Inventory model.
    // For universal compatibility, `GetMyeBaySelling` (Trading API) is often used, but here we'll use the modern REST Sell Inventory API.
    const ebayResponse = await fetch('https://api.ebay.com/sell/inventory/v1/inventory_item?limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!ebayResponse.ok) {
      const errorText = await ebayResponse.text();
      console.error('eBay Sync Error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch eBay inventory. Ensure your seller account is fully set up.' }, { status: 500 });
    }

    const inventoryData = await ebayResponse.json();
    const items = inventoryData.inventoryItems || [];

    if (items.length === 0) {
      return NextResponse.json({ message: 'Sync complete. No listings found on eBay.', count: 0 });
    }

    // 4. Map and save listings to our database
    const listingsToInsert = items.map((item: any) => ({
      user_id: user.id,
      store_credential_id: storeCreds.id,
      external_product_id: item.sku || item.groupIds?.[0] || 'unknown_sku_' + Math.random().toString(36).substring(7),
      original_title: item.product?.title || 'Untitled Product',
      original_description: item.product?.description || '',
      original_specifics: item.product?.aspects || {},
      image_url: item.product?.imageUrls?.[0] || null,
      optimization_status: 'pending'
    }));

    // Upsert to database (prevent duplicates)
    const { error: dbError } = await supabase
      .from('product_listings')
      .upsert(listingsToInsert, { onConflict: 'external_product_id' });

    if (dbError) {
      console.error('DB Insert Error:', dbError);
      return NextResponse.json({ error: 'Failed to save listings to database' }, { status: 500 });
    }

    return NextResponse.json({ message: `Successfully synced ${items.length} listings.`, count: items.length });

  } catch (error: any) {
    console.error('Sync Endpoint Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
