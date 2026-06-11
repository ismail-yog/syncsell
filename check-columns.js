const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zmtmwpetitsdhgtaficc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjQxNjMsImV4cCI6MjA5Njc0MDE2M30.k8npN3JZ2rhZu_6u_0PcyLJh9LDNC_Y7WLRYsg0U-sE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase.rpc('get_columns');
  // If rpc fails, we just try inserting an invalid column and see the error?
  // No, just fetch the data and log the keys of the first row... but there are no rows!
  
  // Let's try inserting a dummy row with only 'user_id' and 'platform' to see if it succeeds, then fetch it to see the columns.
  console.log('Inserting dummy row to read columns...');
  await supabase.from('users').upsert({ id: '00000000-0000-0000-0000-000000000000', email: 'test@test.com' });
  await supabase.from('store_credentials').upsert({ user_id: '00000000-0000-0000-0000-000000000000', platform: 'test' });
  const { data: cols } = await supabase.from('store_credentials').select('*').eq('platform', 'test');
  console.log('Columns:', cols && cols.length > 0 ? Object.keys(cols[0]) : 'Failed');
}

checkColumns();
