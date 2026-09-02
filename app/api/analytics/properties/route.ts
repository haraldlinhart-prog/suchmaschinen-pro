import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshAccessToken, listGa4Properties } from '@/lib/google/analytics';

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
    return NextResponse.json({ properties });
  } catch (e) {
    console.error('GA properties error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Properties konnten nicht geladen werden.' }, { status: 500 });
  }
}
