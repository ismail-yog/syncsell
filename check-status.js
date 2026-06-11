const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zmtmwpetitsdhgtaficc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjQxNjMsImV4cCI6MjA5Njc0MDE2M30.k8npN3JZ2rhZu_6u_0PcyLJh9LDNC_Y7WLRYsg0U-sE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  const { data: users } = await supabase.from('users').select('*');
  console.log('Users:', users);

  const { data: creds, error: credError } = await supabase.from('store_credentials').select('*');
  if (credError) console.error('Cred Error:', credError);
  console.log('Store Credentials:', creds);
  
  // Try to find if there are any error logs somewhere
  const { data: logs, error: logError } = await supabase.from('chat_logs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Logs:', logs);
}

checkStatus();
