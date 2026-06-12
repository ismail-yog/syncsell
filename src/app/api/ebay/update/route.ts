import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';

export async function POST(req: Request) {
  try {
    const { listingId, title, description } = await req.json();

    if (!listingId || !title) {
      return NextResponse.json({ error: 'Missing listingId or title' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch user's eBay token
    const { data: storeCreds, error: credError } = await supabase
      .from('store_credentials')
      .select('encrypted_access_token')
      .eq('user_id', user.id)
      .eq('platform', 'ebay')
      .single();

    if (credError || !storeCreds) {
      return NextResponse.json({ error: 'eBay store not connected' }, { status: 400 });
    }

    const accessToken = decrypt(storeCreds.encrypted_access_token);

    // 2. Construct Trading API XML Payload
    // The Trading API uses XML. We construct a payload to ReviseFixedPriceItem
    // This API bypasses Business Policy strictness and updates the item directly.
    const xmlPayload = `
      <?xml version="1.0" encoding="utf-8"?>
      <ReviseFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <ErrorLanguage>en_US</ErrorLanguage>
        <WarningLevel>High</WarningLevel>
        <Item>
          <ItemID>${listingId.replace('v1|', '').split('|')[0]}</ItemID>
          <Title><![CDATA[${title}]]></Title>
          ${description ? `<Description><![CDATA[${description}]]></Description>` : ''}
        </Item>
      </ReviseFixedPriceItemRequest>
    `.trim();

    // 3. Call eBay Trading API
    const tradingApiUrl = 'https://api.ebay.com/ws/api.dll';
    const tradingResponse = await fetch(tradingApiUrl, {
      method: 'POST',
      headers: {
        'X-EBAY-API-SITEID': '0',
        'X-EBAY-API-COMPATIBILITY-LEVEL': '1241',
        'X-EBAY-API-CALL-NAME': 'ReviseFixedPriceItem',
        'X-EBAY-API-IAF-TOKEN': accessToken,
        'Content-Type': 'text/xml',
      },
      body: xmlPayload,
    });

    const responseText = await tradingResponse.text();

    // Check for success in the XML response
    if (responseText.includes('<Ack>Success</Ack>') || responseText.includes('<Ack>Warning</Ack>')) {
      // 4. Mark as pushed in database (optional status update)
      // For now, we return success so the frontend knows it went through
      return NextResponse.json({ message: 'Successfully updated on eBay' });
    } else {
      console.error("Trading API Failure:", responseText);
      // Extract error message if possible
      const errorMatch = responseText.match(/<LongMessage>(.*?)<\/LongMessage>/);
      const errorMessage = errorMatch ? errorMatch[1] : 'eBay Trading API rejected the revision.';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Trading API Update Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
