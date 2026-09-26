import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeKeyword, volumeProviderConfigured } from '@/lib/keywords/volume';

export const maxDuration = 60;

// Pre-check for a customer's own keyword: demand, expected clicks per Google position,
// the equivalent Google Ads spend, a verdict and — if weak — better related terms.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const keyword: string = typeof body?.keyword === 'string' ? body.keyword.trim().slice(0, 80) : '';
  if (keyword.length < 3) return NextResponse.json({ error: 'Bitte einen Suchbegriff eingeben.' }, { status: 400 });
  if (!volumeProviderConfigured()) return NextResponse.json({ error: 'Die Suchbegriff-Prüfung ist derzeit nicht verfügbar.' }, { status: 503 });

  try {
    return NextResponse.json(await analyzeKeyword(keyword));
  } catch (e) {
    console.error('keyword analyze error', e);
    return NextResponse.json({ error: 'Prüfung fehlgeschlagen. Bitte erneut versuchen.' }, { status: 500 });
  }
}
