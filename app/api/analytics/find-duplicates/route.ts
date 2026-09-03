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

  try {
    const service = createServiceClient();
    const { data: website } = await service
      .from('sq_websites')
      .select('domain, ga_refresh_token')
      .not('ga_refresh_token', 'is', null)
      .limit(1)
      .single();
    if (!website?.ga_refresh_token) return NextResponse.json({ error: 'Kein verbundener GA-Zugang.' }, { status: 404 });

    const accessToken = await refreshAccessToken(website.ga_refresh_token);

    let allProps: { name: string; displayName: string; createTime: string }[] = [];
    let pageToken: string | undefined;
    do {
      const url = new URL(`${GA_ADMIN_API}/properties`);
      url.searchParams.set('filter', `parent:${MAIN_GA_ACCOUNT}`);
      url.searchParams.set('pageSize', '200');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const pRes = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
      const pData = await pRes.json().catch(async () => ({ error: { message: await pRes.text() } }));
      if (!pRes.ok) return NextResponse.json({ error: pData.error?.message }, { status: 502 });
      allProps = allProps.concat(pData.properties || []);
      pageToken = pData.nextPageToken;
    } while (pageToken);

    const propsData = { properties: allProps };

    // Also fetch the known property directly, to see its actual parent account.
    const knownRes = await fetch(`${GA_ADMIN_API}/properties/348347435`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const knownData = await knownRes.json().catch(() => null);

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

    return NextResponse.json({
      totalPropertiesInAccount: allProps.length,
      matches: withStreams,
      knownProperty: knownData ? { name: knownData.name, displayName: knownData.displayName, parent: knownData.parent } : null,
    });
  } catch (e) {
    console.error('find-duplicates error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
