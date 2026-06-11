const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zmtmwpetitsdhgtaficc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjQxNjMsImV4cCI6MjA5Njc0MDE2M30.k8npN3JZ2rhZu_6u_0PcyLJh9LDNC_Y7WLRYsg0U-sE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsers() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('Users Data:', data);
  if (error) console.error('Error:', error);
}

testUsers();
