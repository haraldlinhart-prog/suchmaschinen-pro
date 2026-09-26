import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getKeywordVolumes, volumeProviderConfigured } from '@/lib/keywords/volume';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const keywords: string[] = Array.isArray(body?.keywords) ? body.keywords.filter((k: unknown) => typeof k === 'string').slice(0, 300) : [];
  try {
    const volumes = await getKeywordVolumes(keywords);
    return NextResponse.json({ available: volumeProviderConfigured(), volumes });
  } catch (e) {
    console.error('keyword volume error', e);
    return NextResponse.json({ available: volumeProviderConfigured(), volumes: {} });
  }
}
