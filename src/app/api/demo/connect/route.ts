import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Ensure user exists in public.users
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || 'Demo User'
    }, { onConflict: 'id' });

    // 2. Inject dummy store credentials
    await supabase.from('store_credentials').upsert({
      user_id: user.id,
      platform: 'ebay',
      store_url: 'demo.ebay.com',
      store_name: 'SyncSell Demo Store',
      access_token: 'demo_token_123',
      is_active: true
    }, { onConflict: 'user_id, platform' });

    // 3. Inject mock listings so the user can immediately see the AI in action!
    const mockListings = [
      {
        user_id: user.id,
        external_product_id: 'sku_demo_1',
        original_title: 'Vintage Leather Messenger Bag - Brown',
        original_description: 'Good condition leather bag. Has some scratches but works fine. Brown color. Strap included.',
        image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80',
        optimization_status: 'pending'
      },
      {
        user_id: user.id,
        external_product_id: 'sku_demo_2',
        original_title: 'Sony Headphones Noise Cancelling used',
        original_description: 'Used sony headphones. Noise cancelling works. Battery lasts 10 hours. No box.',
        image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80',
        optimization_status: 'pending'
      },
      {
        user_id: user.id,
        external_product_id: 'sku_demo_3',
        original_title: 'Mechanical Keyboard Blue Switches',
        original_description: 'Clicky mechanical keyboard. RGB lights. Blue switches. USB cable included.',
        image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80',
        optimization_status: 'pending'
      }
    ];

    await supabase.from('product_listings').upsert(mockListings, { onConflict: 'external_product_id' });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Demo Connect Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
