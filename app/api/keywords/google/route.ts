import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScAccessToken } from '@/lib/google/scToken';
import { isAdminEmail } from '@/lib/supabase/admin';

export const maxDuration = 60;

// The search terms Google already shows the domain for (Search Console, last 90 days).
// Uses the admin Search Console connection, so it is admin-only: otherwise any customer
// could read Harry's Search Console data by registering one of his domains. Customers get
// this once they can connect their own Search Console (after Google verification).
export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get('websiteId');
  if (!websiteId) return NextResponse.json({ error: 'websiteId ist erforderlich.' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Noch nicht verfügbar.', unavailable: true }, { status: 403 });

  const { data: website } = await supabase.from('sq_websites').select('domain').eq('id', websiteId).eq('user_id', user.id).single();
  if (!website) return NextResponse.json({ error: 'Website nicht gefunden.' }, { status: 404 });

  const accessTokenPromise = getScAccessToken(user.id);

  try {
    const accessToken = await accessTokenPromise;
    if (!accessToken) return NextResponse.json({ error: 'Ihre Google Search Console ist noch nicht verbunden.', connect: true }, { status: 400 });
    const day = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    const siteUrl = `sc-domain:${website.domain.replace(/^www\./, '')}`;
    const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: day(92), endDate: day(2), dimensions: ['query'], rowLimit: 100 }),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg: string = data.error?.message || '';
      if (res.status === 403 || /permission/i.test(msg)) {
        return NextResponse.json({ error: `${website.domain} ist nicht in Ihrer Google Search Console freigegeben.` }, { status: 400 });
      }
      return NextResponse.json({ error: msg || 'Search-Console-Abfrage fehlgeschlagen.' }, { status: 500 });
    }
    const queries = (data.rows || []).map((r: { keys: string[]; impressions: number; clicks: number; position: number }) => ({
      keyword: r.keys[0],
      impressions: Math.round(r.impressions),
      clicks: Math.round(r.clicks),
      position: Math.round(r.position * 10) / 10,
    }));
    return NextResponse.json({ queries });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Search-Console-Abfrage fehlgeschlagen.' }, { status: 500 });
  }
}
