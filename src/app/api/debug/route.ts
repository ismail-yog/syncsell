import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = [];

  // 1. Check ENV variables
  const envVars = [
    'NEXT_PUBLIC_APP_URL',
    'ENCRYPTION_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'EBAY_APP_ID',
    'EBAY_CERT_ID',
    'EBAY_REDIRECT_URI'
  ];

  let missingEnv = false;
  for (const v of envVars) {
    if (!process.env[v]) {
      checks.push(`❌ MISSING ENV VARIABLE: ${v}`);
      missingEnv = true;
    } else {
      if (v === 'ENCRYPTION_KEY' && process.env[v]?.length !== 64) {
        checks.push(`❌ INVALID ENCRYPTION_KEY: Must be exactly 64 characters. Currently it is ${process.env[v]?.length} characters.`);
        missingEnv = true;
      } else {
        checks.push(`✅ Found ${v}`);
      }
    }
  }

  // 2. Test Supabase Database Connection
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data, error } = await supabase.from('store_credentials').select('id').limit(1);
      
      if (error) {
        checks.push(`❌ DATABASE CONNECTION FAILED: ${error.message}`);
      } else {
        checks.push(`✅ DATABASE CONNECTED SUCCESSFULLY.`);
      }
    } catch (err: any) {
      checks.push(`❌ DATABASE EXCEPTION: ${err.message}`);
    }
  }

  const html = `
    <html>
      <body style="font-family: monospace; padding: 40px; background: #111; color: #0f0; font-size: 16px; line-height: 1.5;">
        <h2>SYSTEM DIAGNOSTICS</h2>
        <hr style="border-color: #333;" />
        ${checks.map(c => `<p>${c}</p>`).join('')}
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
