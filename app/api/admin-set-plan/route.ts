import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const websiteId = body?.website_id;
  const plan = body?.plan;
  if (!websiteId || !['free', 'basic', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'website_id und plan (free|basic|pro) sind erforderlich.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('sq_websites')
    .update({
      plan,
      badge_required: plan === 'free',
      billing_status: plan === 'free' ? 'free' : 'active',
      status: 'active',
    })
    .eq('id', websiteId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, plan });
}
