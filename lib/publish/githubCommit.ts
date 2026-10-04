import { createHash } from 'crypto';

// One commit for several files (04.10.2026). Publishing used to write the article, the
// news index and the article sitemap as three separate Contents-API commits — three
// Vercel builds and three "Successfully deployed" GitHub mails per article (~200 mails
// on the day the cron fan-out caught up 45 sites). The Git Data API lets us put all
// changed files into a single commit. Files whose content is already identical in the
// repo are dropped, and nothing is committed when none changed.

export interface RepoFile {
  path: string;
  content: string;
}

export interface CommitResult {
  committed: boolean;
  sha?: string;
  changedPaths: string[];
}

function gitBlobSha(content: string): string {
  const buf = Buffer.from(content, 'utf-8');
  return createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
}

export async function commitFiles(owner: string, repo: string, token: string, files: RepoFile[], message: string): Promise<CommitResult> {
  const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${base}${path}`, { ...init, headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  };

  // Drop files that are unchanged (the Contents API reports the blob sha of the current file).
  const changed: RepoFile[] = [];
  for (const f of files) {
    const cur = await call(`/contents/${f.path}`);
    if (cur.ok && !Array.isArray(cur.data) && cur.data.sha === gitBlobSha(f.content)) continue;
    changed.push(f);
  }
  if (changed.length === 0) return { committed: false, changedPaths: [] };

  const repoInfo = await call('');
  if (!repoInfo.ok) throw new Error(`GitHub repo lookup failed (${repoInfo.status})`);
  const branch: string = repoInfo.data.default_branch || 'main';

  // Retry when the branch moved between reading the head and updating the ref.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ref = await call(`/git/ref/heads/${branch}`);
    if (!ref.ok) throw new Error(`GitHub ref lookup failed (${ref.status})`);
    const headSha: string = ref.data.object.sha;
    const head = await call(`/git/commits/${headSha}`);
    if (!head.ok) throw new Error(`GitHub commit lookup failed (${head.status})`);

    const tree = await call('/git/trees', {
      method: 'POST',
      body: JSON.stringify({
        base_tree: head.data.tree.sha,
        tree: changed.map(f => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })),
      }),
    });
    if (!tree.ok) throw new Error(`GitHub tree creation failed (${tree.status}): ${JSON.stringify(tree.data)}`);

    const commit = await call('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: tree.data.sha, parents: [headSha] }),
    });
    if (!commit.ok) throw new Error(`GitHub commit creation failed (${commit.status})`);

    const update = await call(`/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.data.sha }),
    });
    if (update.ok) return { committed: true, sha: commit.data.sha, changedPaths: changed.map(f => f.path) };
    if (update.status !== 422 || attempt === 3) throw new Error(`GitHub ref update failed (${update.status}): ${JSON.stringify(update.data)}`);
  }
  throw new Error('GitHub commit failed after retries');
}
