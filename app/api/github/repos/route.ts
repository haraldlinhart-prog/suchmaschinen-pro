import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return NextResponse.json({ error: 'Serverkonfiguration unvollständig (GITHUB_TOKEN fehlt).' }, { status: 500 });
  }

  try {
    const repos: { full_name: string }[] = [];
    let page = 1;
    // GitHub caps per_page at 100; paginate until a short page tells us we're done.
    while (page <= 5) {
      const res = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=full_name&affiliation=owner`,
        {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github+json',
          },
          // Repo list changes rarely; avoid hammering the GitHub API on every form open.
          next: { revalidate: 300 },
        }
      );
      if (!res.ok) {
        return NextResponse.json({ error: `GitHub-API-Fehler (${res.status}).` }, { status: 502 });
      }
      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      repos.push(...batch.map((r: { full_name: string }) => ({ full_name: r.full_name })));
      if (batch.length < 100) break;
      page += 1;
    }

    repos.sort((a, b) => a.full_name.localeCompare(b.full_name));
    return NextResponse.json({ repos });
  } catch {
    return NextResponse.json({ error: 'GitHub-Repos konnten nicht geladen werden.' }, { status: 500 });
  }
}
