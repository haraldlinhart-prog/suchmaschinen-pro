const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GA_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
const GA_DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

const SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'];

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
}

export async function listGa4Properties(accessToken: string): Promise<GaProperty[]> {
  const res = await fetch(`${GA_ADMIN_API}/accountSummaries?pageSize=200`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'GA4-Properties konnten nicht geladen werden.');

  const properties: GaProperty[] = [];
  for (const account of data.accountSummaries || []) {
    for (const p of account.propertySummaries || []) {
      properties.push({ property: p.property, displayName: p.displayName, account: account.displayName });
    }
  }
  return properties;
}

export interface GaDailyRow {
  date: string; // YYYYMMDD
  sessions: number;
  activeUsers: number;
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
