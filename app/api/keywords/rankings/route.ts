import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScAccessToken } from '@/lib/google/scToken';
import { isAdminEmail } from '@/lib/supabase/admin';
import { searchAnalyticsQuery } from '@/lib/google/searchconsole';

export const maxDuration = 60;

// Ranking overview for the dashboard chart (chat 26.09.26): how the website and its
// individual pages rank for which search terms. Admin-only for now (uses the admin
// Search Console connection — see /api/keywords/google for why).

const BUCKETS = [
  { key: 'top3', label: 'Platz 1–3', max: 3 },
  { key: 'top10', label: 'Platz 4–10', max: 10 },
  { key: 'p2', label: 'Platz 11–20', max: 20 },
  { key: 'p3to5', label: 'Platz 21–50', max: 50 },
  { key: 'rest', label: 'Platz 51+', max: Infinity },
];

export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get('websiteId');
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('days') || '90'), 7), 480);
  if (!websiteId) return NextResponse.json({ error: 'websiteId ist erforderlich.' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Noch nicht verfügbar.', unavailable: true }, { status: 403 });

  const { data: website } = await supabase.from('sq_websites').select('domain').eq('id', websiteId).eq('user_id', user.id).single();
  if (!website) return NextResponse.json({ error: 'Website nicht gefunden.' }, { status: 404 });

  const accessTokenPromise = getScAccessToken(user.id);

  const day = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
  const range = { startDate: day(days + 2), endDate: day(2) };
  const siteUrl = `sc-domain:${website.domain.replace(/^www\./, '')}`;

  try {
    const accessToken = await accessTokenPromise;
    if (!accessToken) return NextResponse.json({ error: 'Ihre Google Search Console ist noch nicht verbunden.', connect: true }, { status: 400 });
    const [queryRows, dateRows, pageQueryRows] = await Promise.all([
      searchAnalyticsQuery(accessToken, siteUrl, { ...range, dimensions: ['query'], rowLimit: 1000 }),
      searchAnalyticsQuery(accessToken, siteUrl, { ...range, dimensions: ['date'], rowLimit: 1000 }),
      searchAnalyticsQuery(accessToken, siteUrl, { ...range, dimensions: ['page', 'query'], rowLimit: 5000 }),
    ]);

    const buckets = BUCKETS.map(b => ({ key: b.key, label: b.label, count: 0, keywords: [] as string[] }));
    for (const r of queryRows) {
      const i = BUCKETS.findIndex(b => r.position <= b.max);
      buckets[i].count++;
      if (buckets[i].keywords.length < 8) buckets[i].keywords.push(r.keys[0]);
    }

    const trend = dateRows
      .map(r => ({ date: r.keys[0], position: Math.round(r.position * 10) / 10, clicks: r.clicks, impressions: r.impressions }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const pages = new Map<string, { page: string; impressions: number; clicks: number; keywords: { keyword: string; position: number; impressions: number; clicks: number }[] }>();
    for (const r of pageQueryRows) {
      const [page, keyword] = r.keys;
      if (!pages.has(page)) pages.set(page, { page, impressions: 0, clicks: 0, keywords: [] });
      const p = pages.get(page)!;
      p.impressions += r.impressions;
      p.clicks += r.clicks;
      p.keywords.push({ keyword, position: Math.round(r.position * 10) / 10, impressions: r.impressions, clicks: r.clicks });
    }
    const pageList = [...pages.values()]
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 25)
      .map(p => ({ ...p, keywords: p.keywords.sort((a, b) => b.impressions - a.impressions).slice(0, 40) }));

    const totalImpr = queryRows.reduce((n, r) => n + r.impressions, 0);
    const avgPosition = totalImpr ? queryRows.reduce((n, r) => n + r.position * r.impressions, 0) / totalImpr : null;

    return NextResponse.json({
      days,
      totals: {
        keywords: queryRows.length,
        page1: buckets[0].count + buckets[1].count,
        avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
        impressions: Math.round(totalImpr),
        clicks: Math.round(queryRows.reduce((n, r) => n + r.clicks, 0)),
      },
      buckets,
      trend,
      pages: pageList,
    });
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 403) return NextResponse.json({ error: `${website.domain} ist nicht in Ihrer Google Search Console freigegeben.` }, { status: 400 });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Abfrage fehlgeschlagen.' }, { status: 500 });
  }
}
