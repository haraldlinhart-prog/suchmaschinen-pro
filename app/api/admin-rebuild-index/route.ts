import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishNewsIndex } from '@/lib/publish/publishNewsIndex';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { websiteId } = await req.json();
  if (!websiteId) return NextResponse.json({ error: 'websiteId required' }, { status: 400 });

  const supabase = await createClient();
  const { data: website, error } = await supabase
    .from('sq_websites')
    .select('id, domain, github_repo, publish_path, public_slug')
    .eq('id', websiteId)
    .single();

  if (error || !website) return NextResponse.json({ error: 'Website nicht gefunden' }, { status: 404 });

  await publishNewsIndex(website, supabase);
  return NextResponse.json({ ok: true, domain: website.domain });
}
