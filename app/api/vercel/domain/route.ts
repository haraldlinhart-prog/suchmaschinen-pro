import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/supabase/admin';

type VercelProject = {
  id: string;
  name: string;
  link?: { type?: string; org?: string; repo?: string } | null;
};

type VercelDomain = { name: string; verified?: boolean };

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const repo = req.nextUrl.searchParams.get('repo');
  if (!repo || !repo.includes('/')) {
    return NextResponse.json({ error: 'Parameter "repo" (owner/name) ist erforderlich.' }, { status: 400 });
  }
  const [owner, repoName] = repo.split('/');

  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;
  if (!vercelToken || !vercelTeamId) {
    return NextResponse.json({ error: 'Serverkonfiguration unvollständig (VERCEL_TOKEN/VERCEL_TEAM_ID fehlt).' }, { status: 500 });
  }

  try {
    // Find the Vercel project linked to this GitHub repo (paginate through the team's projects).
    let project: VercelProject | undefined;
    let cursor: string | undefined;
    for (let i = 0; i < 5 && !project; i++) {
      const url = new URL('https://api.vercel.com/v9/projects');
      url.searchParams.set('teamId', vercelTeamId);
      url.searchParams.set('limit', '100');
      if (cursor) url.searchParams.set('until', cursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${vercelToken}` },
        next: { revalidate: 60 },
      });
      if (!res.ok) return NextResponse.json({ error: `Vercel-API-Fehler (${res.status}).` }, { status: 502 });

      const data = await res.json();
      const projects: VercelProject[] = data.projects || [];
      project = projects.find(
        p => p.link?.type === 'github' &&
          p.link?.repo?.toLowerCase() === repoName.toLowerCase() &&
          p.link?.org?.toLowerCase() === owner.toLowerCase()
      );

      const next = data.pagination?.next;
      if (!next || projects.length === 0) break;
      cursor = next;
    }

    if (!project) {
      return NextResponse.json({ domain: null });
    }

    const domRes = await fetch(
      `https://api.vercel.com/v9/projects/${project.id}/domains?teamId=${vercelTeamId}`,
      { headers: { Authorization: `Bearer ${vercelToken}` }, next: { revalidate: 60 } }
    );
    if (!domRes.ok) return NextResponse.json({ domain: null });

    const domData = await domRes.json();
    const domains: VercelDomain[] = domData.domains || [];
    // Prefer a real custom domain over the auto-generated *.vercel.app one; prefer the bare
    // (non-"www.") variant so it matches what customers type into the domain field.
    const custom = domains.filter(d => !d.name.endsWith('.vercel.app'));
    const best = custom.find(d => !d.name.startsWith('www.')) || custom[0];

    return NextResponse.json({ domain: best?.name || null });
  } catch {
    return NextResponse.json({ error: 'Domain konnte nicht ermittelt werden.' }, { status: 500 });
  }
}
