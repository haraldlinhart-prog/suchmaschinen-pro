import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken, createGa4PropertyWithStream, MAIN_GA_ACCOUNT } from '@/lib/google/analytics';

// Temporary test route (see chat 03.09.26) — creates ONE new GA4 property under the
// main account for the given website, without touching the old property or the DB.
// Purely for manual verification before building the real "1-click" flow.
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

  if (!website?.ga_refresh_token) {
    return NextResponse.json({ error: 'Für diese Website ist kein GA-Zugang verbunden.' }, { status: 404 });
  }

  try {
    const accessToken = await refreshAccessToken(website.ga_refresh_token);
    const result = await createGa4PropertyWithStream(accessToken, MAIN_GA_ACCOUNT, website.domain);
    return NextResponse.json({
      domain: website.domain,
      created: result,
      oldPropertyId: website.ga_property_id,
      note: 'DB wurde NICHT aktualisiert und die alte Property wurde NICHT gelöscht — rein zur Verifikation.',
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler.' }, { status: 500 });
  }
}
