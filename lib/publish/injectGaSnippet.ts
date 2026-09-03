interface GhFile {
  name: string;
  type: string;
}

function gaSnippet(measurementId: string): { headTag: string; jsx: string } {
  return {
    headTag: `<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`,
    jsx: `{/* Google Analytics (GA4) — via suchmaschinen.pro */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}" />
        <script
          dangerouslySetInnerHTML={{
            __html: \`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');\`,
          }}
        />`,
  };
}

async function ghGetFile(owner: string, repo: string, path: string, token: string): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data) || !data.content) return null;
  return { content: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
}

async function ghPutFile(owner: string, repo: string, path: string, content: string, sha: string, message: string, token: string): Promise<void> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: Buffer.from(content, 'utf-8').toString('base64'), sha }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub-Commit fehlgeschlagen (${res.status}): ${err}`);
  }
}

export type SnippetInjectResult =
  | { status: 'already-present'; path: string }
  | { status: 'injected'; path: string }
  | { status: 'no-repo' }
  | { status: 'unrecognized-template' };

/**
 * Injects (or confirms) the GA4 gtag.js snippet in a network site's repo. Supports the
 * two templates in use across the PAN21 network (see chat 03.09.26):
 *  - Next.js App Router: app/layout.tsx, inserted into the <head>...</head> JSX block
 *  - Static HTML: index.html at repo root, inserted before </head>
 * Anything else (Pages Router, unusual layouts) is reported as unrecognized so it can
 * be handled manually rather than risk a wrong guess.
 */
export async function injectGaSnippet(
  githubRepo: string,
  measurementId: string,
  githubToken: string
): Promise<SnippetInjectResult> {
  const [owner, repo] = githubRepo.split('/');
  const { headTag, jsx } = gaSnippet(measurementId);

  const rootRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
    headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' },
  });
  const rootEntries: GhFile[] = rootRes.ok ? await rootRes.json() : [];
  const isNextJs = rootEntries.some(e => /^next\.config\.(js|mjs|ts)$/.test(e.name));

  if (isNextJs) {
    const path = 'app/layout.tsx';
    const file = await ghGetFile(owner, repo, path, githubToken);
    if (!file) return { status: 'unrecognized-template' };
    if (file.content.includes(measurementId)) return { status: 'already-present', path };

    const headCloseIdx = file.content.indexOf('</head>');
    if (headCloseIdx === -1) return { status: 'unrecognized-template' };
    const updated = `${file.content.slice(0, headCloseIdx)}\n        ${jsx}\n      ${file.content.slice(headCloseIdx)}`;
    await ghPutFile(owner, repo, path, updated, file.sha, 'suchmaschinen.pro: GA4-Snippet eingebunden', githubToken);
    return { status: 'injected', path };
  }

  // Static HTML site.
  const path = 'index.html';
  const file = await ghGetFile(owner, repo, path, githubToken);
  if (!file) return { status: 'unrecognized-template' };
  if (file.content.includes(measurementId)) return { status: 'already-present', path };

  const headCloseIdx = file.content.indexOf('</head>');
  if (headCloseIdx === -1) return { status: 'unrecognized-template' };
  const updated = `${file.content.slice(0, headCloseIdx)}${headTag}\n${file.content.slice(headCloseIdx)}`;
  await ghPutFile(owner, repo, path, updated, file.sha, 'suchmaschinen.pro: GA4-Snippet eingebunden', githubToken);
  return { status: 'injected', path };
}
