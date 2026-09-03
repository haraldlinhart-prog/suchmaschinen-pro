const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GA_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
const GA_DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  // Needed to create GA4 properties/data streams programmatically (see chat 03.09.26).
  'https://www.googleapis.com/auth/analytics.edit',
];

// The one GA4 account all future auto-created properties should live under —
// see chat 03.09.26 (previously scattered across 25 accounts by accident).
export const MAIN_GA_ACCOUNT = 'accounts/230676168';

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
function redirectUri(): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI || 'https://www.suchmaschinen.pro/api/analytics/callback';
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES.join(' '),
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

export interface GaProperty {
  property: string; // e.g. "properties/123456789"
  displayName: string;
  account: string;
  domain?: string; // enriched separately via getPropertyDomains — the actual tracked hostname
}

export async function listGa4Properties(accessToken: string): Promise<GaProperty[]> {
  const properties: GaProperty[] = [];
  let pageToken: string | undefined;

  // accountSummaries paginates per Google *account*, not per property — with this many
  // network domains under one Google account, a single page can silently truncate the
  // list. Follow nextPageToken until exhausted (see chat 02.09.26).
  do {
    const url = new URL(`${GA_ADMIN_API}/accountSummaries`);
    url.searchParams.set('pageSize', '200');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'GA4-Properties konnten nicht geladen werden.');

    for (const account of data.accountSummaries || []) {
      for (const p of account.propertySummaries || []) {
        properties.push({ property: p.property, displayName: p.displayName, account: account.displayName });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  properties.sort((a, b) => a.displayName.localeCompare(b.displayName, 'de'));
  return properties;
}

/**
 * Property display names in this account don't reliably follow the tracked domain
 * (many are generic, e.g. "PAN21.com Corporate Consultants" reused across dozens of
 * sites) — see chat 02.09.26. Fetch each property's actual web data stream hostname so
 * the picker can search/match by real domain instead. Limited concurrency to stay
 * within GA4 Admin API rate limits across ~200 properties.
 */
export async function enrichWithDomains(accessToken: string, properties: GaProperty[]): Promise<GaProperty[]> {
  const CONCURRENCY = 8;
  const result = [...properties];
  let cursor = 0;

  async function worker() {
    while (cursor < result.length) {
      const i = cursor++;
      try {
        const res = await fetch(`${GA_ADMIN_API}/${result[i].property}/dataStreams?pageSize=10`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) continue;
        const data = await res.json();
        const webStream = (data.dataStreams || []).find((s: { webStreamData?: { defaultUri?: string } }) => s.webStreamData?.defaultUri);
        if (webStream?.webStreamData?.defaultUri) {
          try {
            result[i] = { ...result[i], domain: new URL(webStream.webStreamData.defaultUri).hostname.replace(/^www\./, '') };
          } catch {
            // malformed URI, skip
          }
        }
      } catch {
        // one property's enrichment failing shouldn't break the rest
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return result;
}

export interface GaDailyRow {
  date: string; // YYYYMMDD
  sessions: number;
  activeUsers: number;
}

/**
 * Creates a new GA4 property under the given account, plus a web data stream for the
 * given domain, and returns the resulting property resource name and Measurement ID.
 * See chat 03.09.26 — used for the "1-click GA4 setup" flow.
 */
export async function createGa4PropertyWithStream(
  accessToken: string,
  accountResourceName: string,
  domain: string
): Promise<{ property: string; measurementId: string; streamUri: string }> {
  const propRes = await fetch(`${GA_ADMIN_API}/properties`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parent: accountResourceName,
      displayName: domain.slice(0, 100),
      timeZone: 'Europe/Berlin',
      currencyCode: 'EUR',
    }),
  });
  const propData = await propRes.json();
  if (!propRes.ok) throw new Error(propData.error?.message || 'GA4-Property konnte nicht erstellt werden.');
  const propertyName: string = propData.name; // "properties/123456789"

  const streamUri = `https://${domain}`;
  const streamRes = await fetch(`${GA_ADMIN_API}/${propertyName}/dataStreams`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'WEB_DATA_STREAM',
      displayName: domain,
      webStreamData: { defaultUri: streamUri },
    }),
  });
  const streamData = await streamRes.json();
  if (!streamRes.ok) throw new Error(streamData.error?.message || 'GA4-Datenstream konnte nicht erstellt werden.');

  const measurementId: string | undefined = streamData.webStreamData?.measurementId;
  if (!measurementId) throw new Error('GA4-Datenstream wurde erstellt, aber keine Measurement-ID erhalten.');

  return { property: propertyName, measurementId, streamUri };
}

/** Fetches the Measurement ID of a property's (first) web data stream, or null if none. */
export async function getWebStreamMeasurementId(accessToken: string, propertyResourceName: string): Promise<string | null> {
  const res = await fetch(`${GA_ADMIN_API}/${propertyResourceName}/dataStreams?pageSize=10`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const webStream = (data.dataStreams || []).find((s: { webStreamData?: { measurementId?: string } }) => s.webStreamData?.measurementId);
  return webStream?.webStreamData?.measurementId || null;
}

/** Permanently deletes a GA4 property (moves it to GA's 30-day trash, technically). */
export async function deleteGa4Property(accessToken: string, propertyResourceName: string): Promise<void> {
  const res = await fetch(`${GA_ADMIN_API}/${propertyResourceName}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `GA4-Property konnte nicht gelöscht werden (${res.status}).`);
  }
}


export async function runDailyReport(accessToken: string, propertyId: string, days: number): Promise<GaDailyRow[]> {
  const res = await fetch(`${GA_DATA_API}/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'GA4-Report konnte nicht geladen werden.');

  return (data.rows || []).map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
    date: row.dimensionValues[0].value,
    sessions: Number(row.metricValues[0].value),
    activeUsers: Number(row.metricValues[1].value),
  }));
}
