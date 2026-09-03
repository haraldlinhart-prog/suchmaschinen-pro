import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/supabase/admin';
import {
  refreshAccessToken,
  createGa4PropertyWithStream,
  getWebStreamMeasurementId,
  MAIN_GA_ACCOUNT,
} from '@/lib/google/analytics';
import { injectGaSnippet } from '@/lib/publish/injectGaSnippet';

// One-click GA4 setup (see chat 03.09.26): reuses the website's existing property if it
// has one, otherwise creates a fresh one under the main account; either way, then makes
// sure the gtag.js snippet is actually present in the linked repo. Admin-only for now —
// creates real GA4 resources and commits to Harry's own repos.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const websiteId = body?.websiteId;
  if (!websiteId) return NextResponse.json({ error: 'websiteId ist erforderlich.' }, { status: 400 });

  const { data: website } = await supabase
    .from('sq_websites')
    .select('*')
    .eq('id', websiteId)
    .eq('user_id', user.id)
    .single();

  if (!website) return NextResponse.json({ error: 'Website nicht gefunden.' }, { status: 404 });
  if (!website.ga_refresh_token) {
    return NextResponse.json({ error: 'Bitte zuerst mit Google Analytics verbinden (Consent-Klick).' }, { status: 400 });
  }

  try {
    const accessToken = await refreshAccessToken(website.ga_refresh_token);

    let propertyId: string = website.ga_property_id;
    let measurementId: string | null = null;
    let propertyAction: 'reused' | 'created' = 'created';

    if (propertyId) {
      measurementId = await getWebStreamMeasurementId(accessToken, propertyId);
      propertyAction = 'reused';
    }
    if (!propertyId || !measurementId) {
      const created = await createGa4PropertyWithStream(accessToken, MAIN_GA_ACCOUNT, website.domain);
      propertyId = created.property;
      measurementId = created.measurementId;
      propertyAction = 'created';

      await supabase
        .from('sq_websites')
        .update({ ga_property_id: propertyId, ga_property_name: website.domain })
        .eq('id', websiteId);
    }

    let snippet: Awaited<ReturnType<typeof injectGaSnippet>> = { status: 'no-repo' };
    if (website.github_repo) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) return NextResponse.json({ error: 'Serverkonfiguration unvollständig (GITHUB_TOKEN fehlt).' }, { status: 500 });
      snippet = await injectGaSnippet(website.github_repo, measurementId, githubToken);
    }

    return NextResponse.json({
      domain: website.domain,
      propertyId,
      measurementId,
      propertyAction,
      snippet,
    });
  } catch (e) {
    console.error('GA setup error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Einrichtung fehlgeschlagen.' }, { status: 500 });
  }
}
