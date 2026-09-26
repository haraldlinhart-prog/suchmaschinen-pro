import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAuthUrl } from '@/lib/google/analytics';
import { GA_FOR_CUSTOMERS } from '@/lib/features';
import { isAdminEmail } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get('websiteId');
  if (!websiteId) return NextResponse.json({ error: 'websiteId ist erforderlich.' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  const isAdmin = isAdminEmail(user.email);
  if (!isAdmin && !GA_FOR_CUSTOMERS) return NextResponse.json({ error: 'Diese Funktion ist noch nicht verfügbar.' }, { status: 403 });

  const { data: website } = await supabase.from('sq_websites').select('id').eq('id', websiteId).eq('user_id', user.id).single();
  if (!website) return NextResponse.json({ error: 'Website nicht gefunden.' }, { status: 404 });

  // state carries the websiteId through the Google redirect round-trip.
  const state = Buffer.from(JSON.stringify({ websiteId, uid: user.id })).toString('base64url');

  try {
    return NextResponse.redirect(buildAuthUrl(state, isAdmin));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Google-OAuth ist nicht konfiguriert.' }, { status: 500 });
  }
}
