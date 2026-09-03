const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SC_API = 'https://www.googleapis.com/webmasters/v3';

const SC_SCOPES = ['https://www.googleapis.com/auth/webmasters'];

function clientId(): string {
  const v = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!v) throw new Error('GOOGLE_OAUTH_CLIENT_ID ist nicht gesetzt.');
  return v;
}
function clientSecret(): string {
  const v = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!v) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET ist nicht gesetzt.');
  return v;
}
// Reuses the already-registered redirect URI (see lib/google/analytics.ts) so no new
// URI needs whitelisting in the Google Cloud OAuth client — the callback route branches
// on state.purpose to tell this flow apart from the customer-facing GA connect flow.
function redirectUri(): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || 'https://www.suchmaschinen.pro/api/analytics/callback';
}

export function buildSearchConsoleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SC_SCOPES.join(' '),
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{ access_token: string; refresh_token?: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Google-Token-Austausch fehlgeschlagen.');
  return data;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || 'Google-Token-Refresh fehlgeschlagen.');
  return data.access_token;
}

export interface ScSite {
  siteUrl: string;
  permissionLevel: string;
}

export async function listSites(accessToken: string): Promise<ScSite[]> {
  const res = await fetch(`${SC_API}/sites`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Search-Console-Sites konnten nicht geladen werden.');
  return data.siteEntry || [];
}

export interface ScSitemap {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  warnings?: string;
  errors?: string;
  contents?: { type: string; submitted: string; indexed?: string }[];
}

export async function listSitemaps(accessToken: string, siteUrl: string): Promise<ScSitemap[]> {
  const res = await fetch(`${SC_API}/sites/${encodeURIComponent(siteUrl)}/sitemaps`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Sitemaps konnten nicht geladen werden.');
  return data.sitemap || [];
}

export async function submitSitemap(accessToken: string, siteUrl: string, sitemapUrl: string): Promise<void> {
  const res = await fetch(
    `${SC_API}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
    { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sitemap-Einreichung fehlgeschlagen (${res.status}): ${text}`);
  }
}

// URL Inspection API — ground truth for a single URL's actual Google index status,
// independent of (and more reliable than) the sitemap resource's own "indexed" counter
// (see chat 03.09.26 — used to sanity-check the network-wide sitemap scan).
export async function inspectUrl(accessToken: string, siteUrl: string, inspectionUrl: string) {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'URL-Inspektion fehlgeschlagen.');
  return data.inspectionResult;
}
