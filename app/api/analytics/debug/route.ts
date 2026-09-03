import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken } from '@/lib/google/analytics';

const GA_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
const GA_DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

// Temporary debug route (see chat 03.09.26) — dumps the raw GA4 Data API response and
// the property's actual data stream hostname, to diagnose "Noch keine Daten" for
// properties that should have traffic.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const websiteId = req.nextUrl.searchParams.get('websiteId');
  if (!websiteId) return NextResponse.json({ error: 'websiteId ist erforderlich.' }, { status: 400 });

  const service = createServiceClient();
  const { data: website } = await service
    .from('sq_websites')
    .select('domain, ga_refresh_token, ga_property_id')
    .eq('id', websiteId)
    .single();

  if (!website?.ga_refresh_token || !website?.ga_property_id) {
    return NextResponse.json({ error: 'Nicht verbunden.' }, { status: 404 });
  }

  try {
    const accessToken = await refreshAccessToken(website.ga_refresh_token);

    // 1. What data streams (and hostnames) does this property actually have?
    const streamsRes = await fetch(`${GA_ADMIN_API}/${website.ga_property_id}/dataStreams`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const streamsData = await streamsRes.json();

    // 2. Raw report response, wide-open date range to rule out a date-window issue.
    const reportRes = await fetch(`${GA_DATA_API}/${website.ga_property_id}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
        limit: 5,
      }),
    });
    const reportData = await reportRes.json();

    return NextResponse.json({
      domain: website.domain,
      propertyId: website.ga_property_id,
      dataStreams: streamsData,
      reportStatus: reportRes.status,
      reportRowCount: reportData.rowCount ?? null,
      reportSample: reportData,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler.' }, { status: 500 });
  }
}
