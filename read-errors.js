const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zmtmwpetitsdhgtaficc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG13cGV0aXRzZGhndGFmaWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjQxNjMsImV4cCI6MjA5Njc0MDE2M30.k8npN3JZ2rhZu_6u_0PcyLJh9LDNC_Y7WLRYsg0U-sE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function readErrors() {
  console.log('Reading Errors from Database...');
  
  const { data, error } = await supabase.from('chat_logs').select('*').order('created_at', { ascending: false }).limit(5);
  
  if (error) {
    console.error('DATABASE ERROR:', error);
    process.exit(1);
  }
  
  console.log('Last 5 errors:', JSON.stringify(data, null, 2));
}

readErrors();
