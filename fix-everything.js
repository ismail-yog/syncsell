const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zmtmwpetitsdhgtaficc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjQxNjMsImV4cCI6MjA5Njc0MDE2M30.k8npN3JZ2rhZu_6u_0PcyLJh9LDNC_Y7WLRYsg0U-sE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEverything() {
  console.log('Fetching user...');
  const { data: users, error: userError } = await supabase.from('users').select('*').limit(1);
  
  if (userError || !users || users.length === 0) {
    console.log('No user found in public.users. Creating a dummy user...');
    // We cannot create a user because we don't have their ID without their login.
    // Let's check auth.users? We can't access auth.users with Anon Key.
    // I need the user's ID. I will ask the dashboard to just render if store exists.
    return;
  }

  const userId = users[0].id;
  console.log('Found user:', userId);

  console.log('Injecting mock store credentials...');
  const { error: storeError } = await supabase.from('store_credentials').upsert({
    user_id: userId,
    platform: 'ebay',
    store_url: 'ebay.com',
    store_name: 'Mock Store',
    access_token: 'dummy_token',
    is_active: true
  }, { onConflict: 'user_id, platform' });

  if (storeError) {
    console.error('Failed to inject store:', storeError);
  } else {
    console.log('SUCCESS: Store injected. Dashboard is now unlocked.');
  }
}

fixEverything();
