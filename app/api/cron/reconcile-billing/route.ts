import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { retrieveSubscription } from '@/lib/stripe/client';
import { isBadgeEmbedded } from '@/lib/badge/checkBadge';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: Array<{ domain: string; check: string; detail?: string }> = [];

  // 1) Paying customers: poll subscription status instead of relying on a webhook
  // (Stripe account is at its 16-endpoint webhook limit, see chat 02.09.26).
  const { data: paidSites } = await supabase
    .from('sq_websites')
    .select('id, domain, stripe_subscription_id, billing_status')
    .not('stripe_subscription_id', 'is', null);

  for (const site of paidSites || []) {
    try {
      const sub = await retrieveSubscription(site.stripe_subscription_id as string);
      const newStatus =
        sub.status === 'active' || sub.status === 'trialing'
          ? 'active'
          : sub.status === 'past_due' || sub.status === 'unpaid'
          ? 'past_due'
          : 'canceled';

      if (newStatus !== site.billing_status) {
        await supabase
          .from('sq_websites')
          .update({
            billing_status: newStatus,
            ...(newStatus === 'canceled' ? { plan: 'free', badge_required: true } : {}),
          })
          .eq('id', site.id);
      }
      results.push({ domain: site.domain, check: 'billing', detail: newStatus });
    } catch (err) {
      console.error(`Reconcile: billing check failed for ${site.domain}`, err);
      results.push({ domain: site.domain, check: 'billing', detail: 'error' });
    }
  }

  // 2) Free-tier customers: badge must still be embedded, otherwise runs pause.
  const { data: freeSites } = await supabase
    .from('sq_websites')
    .select('id, domain')
    .eq('plan', 'free')
    .eq('status', 'active');

  for (const site of freeSites || []) {
    const embedded = await isBadgeEmbedded(site.domain);
    await supabase
      .from('sq_websites')
      .update({
        badge_status: embedded ? 'active' : 'missing',
        badge_checked_at: new Date().toISOString(),
      })
      .eq('id', site.id);
    results.push({ domain: site.domain, check: 'badge', detail: embedded ? 'active' : 'missing' });
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}
