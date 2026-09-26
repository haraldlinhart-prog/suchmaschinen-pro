import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Puts a keyword at the front of the website's keyword list, so the next automatic
// article is written for it (the cron takes the first unused suggested keyword).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const websiteId: string | undefined = body?.websiteId;
  const keyword: string = typeof body?.keyword === 'string' ? body.keyword.trim().slice(0, 120) : '';
  if (!websiteId || !keyword) return NextResponse.json({ error: 'websiteId und keyword sind erforderlich.' }, { status: 400 });

  const { data: website } = await supabase.from('sq_websites').select('suggested_keywords').eq('id', websiteId).eq('user_id', user.id).single();
  if (!website) return NextResponse.json({ error: 'Website nicht gefunden.' }, { status: 404 });

  const list: Array<{ keyword: string; rationale: string; intent: string; source?: string }> = website.suggested_keywords || [];
  const existing = list.find(k => k.keyword.toLowerCase() === keyword.toLowerCase());
  const entry = existing || {
    keyword,
    rationale: typeof body?.rationale === 'string' && body.rationale ? body.rationale : 'Selbst gewählter Suchbegriff',
    intent: ['informational', 'commercial', 'transactional'].includes(body?.intent) ? body.intent : 'informational',
    source: typeof body?.source === 'string' ? body.source : 'manual',
  };
  const next = [entry, ...list.filter(k => k !== existing)];

  const { error } = await supabase.from('sq_websites').update({ suggested_keywords: next }).eq('id', websiteId).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, keywords: next });
}
