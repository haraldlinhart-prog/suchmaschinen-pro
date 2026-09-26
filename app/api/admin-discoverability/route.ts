import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { ensureDiscoverability, type DiscoverabilityResult } from '@/lib/publish/ensureDiscoverability';

export const maxDuration = 300;

// One-click backfill: runs ensureDiscoverability for every GitHub-linked website that
// already has published articles (sitemap-blog.xml, robots.txt line, homepage link).
// The daily cron does the same for auto-publish sites; this covers all of them now.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: websites } = await service
    .from('sq_websites')
    .select('id, domain, github_repo, publish_path')
    .not('github_repo', 'is', null);

  const results: Array<DiscoverabilityResult | { domain: string; error: string }> = [];
  for (const website of websites || []) {
    try {
      results.push(await ensureDiscoverability(website, service));
    } catch (e) {
      results.push({ domain: website.domain, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}
