import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken, MAIN_GA_ACCOUNT } from '@/lib/google/analytics';

const GA_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';

// Temporary diagnostic route (see chat 03.09.26) — lists every property in the main
// account whose display name matches a search term, with its data streams, so we can
// see whether "firmenabwicklung.de" and "firmenabwicklung.de GA4" are two separate
// properties (leftover UA→GA4 migration pair) and which one actually has data.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const search = (req.nextUrl.searchParams.get('q') || '').toLowerCase();

  const service = createServiceClient();
  const { data: website } = await service
    .from('sq_websites')
    .select('domain, ga_refresh_token')
    .not('ga_refresh_token', 'is', null)
    .limit(1)
    .single();
  if (!website?.ga_refresh_token) return NextResponse.json({ error: 'Kein verbundener GA-Zugang.' }, { status: 404 });

  try {
    const accessToken = await refreshAccessToken(website.ga_refresh_token);

    const propsRes = await fetch(`${GA_ADMIN_API}/${MAIN_GA_ACCOUNT}/properties?filter=parent:${MAIN_GA_ACCOUNT}&pageSize=200`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const propsData = await propsRes.json();
    if (!propsRes.ok) return NextResponse.json({ error: propsData.error?.message }, { status: 502 });

    const matches = (propsData.properties || []).filter((p: { displayName: string }) =>
      p.displayName.toLowerCase().includes(search)
    );

    const withStreams = await Promise.all(
      matches.map(async (p: { name: string; displayName: string; createTime: string }) => {
        const sRes = await fetch(`${GA_ADMIN_API}/${p.name}/dataStreams`, { headers: { Authorization: `Bearer ${accessToken}` } });
        const sData = sRes.ok ? await sRes.json() : {};
        return {
          property: p.name,
          displayName: p.displayName,
          createTime: p.createTime,
          streams: (sData.dataStreams || []).map((s: { webStreamData?: { defaultUri?: string; measurementId?: string } }) => s.webStreamData),
        };
      })
    );

    return NextResponse.json({ matches: withStreams });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler.' }, { status: 500 });
  }
}
