import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshAccessToken, runDailyReport } from '@/lib/google/analytics';

export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get('websiteId');
  const days = Number(req.nextUrl.searchParams.get('days') || '30');
  if (!websiteId) return NextResponse.json({ error: 'websiteId ist erforderlich.' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { data: website } = await supabase
    .from('sq_websites')
    .select('ga_refresh_token, ga_property_id')
    .eq('id', websiteId)
    .eq('user_id', user.id)
    .single();

  if (!website?.ga_refresh_token || !website?.ga_property_id) {
    return NextResponse.json({ error: 'Google Analytics ist nicht vollständig verbunden.' }, { status: 400 });
  }

  try {
    const accessToken = await refreshAccessToken(website.ga_refresh_token);
    const rows = await runDailyReport(accessToken, website.ga_property_id, days);
    return NextResponse.json({ rows });
  } catch (e) {
    console.error('GA data error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Daten konnten nicht geladen werden.' }, { status: 500 });
  }
}
