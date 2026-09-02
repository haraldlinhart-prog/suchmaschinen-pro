import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { retrieveCheckoutSession } from '@/lib/stripe/client';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
  }

  try {
    const session = await retrieveCheckoutSession(sessionId);

    if (session.payment_status !== 'paid' || !session.client_reference_id) {
      return NextResponse.json({ confirmed: false, payment_status: session.payment_status });
    }

    // metadata.plan isn't on the light session type above; read it back explicitly.
    const plan = (session as unknown as { metadata?: { plan?: string } }).metadata?.plan === 'pro' ? 'pro' : 'basic';

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('sq_websites')
      .update({
        plan,
        badge_required: false,
        billing_status: 'active',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'active',
      })
      .eq('id', session.client_reference_id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ confirmed: true, plan });
  } catch (err) {
    console.error('confirm-checkout failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Confirmation failed' }, { status: 500 });
  }
}
