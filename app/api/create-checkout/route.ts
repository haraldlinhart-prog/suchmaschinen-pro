import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createCheckoutSession } from '@/lib/stripe/client';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const websiteId = body?.website_id;
  const plan = body?.plan;

  if (!websiteId || (plan !== 'basic' && plan !== 'pro')) {
    return NextResponse.json({ error: 'website_id and plan (basic|pro) are required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: website, error } = await supabase
    .from('sq_websites')
    .select('id, domain')
    .eq('id', websiteId)
    .single();

  if (error || !website) {
    return NextResponse.json({ error: 'Website not found' }, { status: 404 });
  }

  const origin = req.headers.get('origin') || 'https://suchmaschinen.pro';

  try {
    const session = await createCheckoutSession({
      websiteId: website.id,
      plan,
      domain: website.domain,
      successUrl: `${origin}/dashboard/${website.id}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard/${website.id}?checkout=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Checkout failed' }, { status: 500 });
  }
}
