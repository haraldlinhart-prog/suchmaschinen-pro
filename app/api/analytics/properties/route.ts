import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshAccessToken, listGa4Properties, enrichWithDomains } from '@/lib/google/analytics';

// ~200 properties enriched with 8-way concurrency can take a while; default function
// timeout would cut it off (see chat 02.09.26).
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const websiteId = req.nextUrl.searchParams.get('websiteId');
  if (!websiteId) return NextResponse.json({ error: 'websiteId ist erforderlich.' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const { data: website } = await supabase
    .from('sq_websites')
    .select('ga_refresh_token')
    .eq('id', websiteId)
    .eq('user_id', user.id)
    .single();

  if (!website?.ga_refresh_token) return NextResponse.json({ error: 'Google Analytics ist nicht verbunden.' }, { status: 400 });

  try {
    const accessToken = await refreshAccessToken(website.ga_refresh_token);
    const properties = await listGa4Properties(accessToken);
    const enriched = await enrichWithDomains(accessToken, properties);
    return NextResponse.json({ properties: enriched });
  } catch (e) {
    console.error('GA properties error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Properties konnten nicht geladen werden.' }, { status: 500 });
  }
}
