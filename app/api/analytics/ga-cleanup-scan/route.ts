import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken } from '@/lib/google/analytics';

export const maxDuration = 300;

const GA_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';
const GA_DATA_API = 'https://analyticsdata.googleapis.com/v1beta';

// All 25 GA4 accounts under Harry's Google login (see chat 03.09.26 — discovered via
// accountSummaries). Hardcoded since this is a one-off cleanup scan, not a live feature.
const ACCOUNTS = [
  'accounts/230676168', 'accounts/252882534', 'accounts/252906027', 'accounts/252933199',
  'accounts/252944457', 'accounts/252972603', 'accounts/252972710', 'accounts/253014446',
  'accounts/253306588', 'accounts/253311334', 'accounts/253314488', 'accounts/253323979',
  'accounts/253325227', 'accounts/253325836', 'accounts/253330780', 'accounts/253334110',
  'accounts/253335789', 'accounts/253337411', 'accounts/253340993', 'accounts/253341757',
  'accounts/253347797', 'accounts/253353269', 'accounts/253367325', 'accounts/406673221',
  'accounts/406693524',
];

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*[-–—|]\s*ga4\s*$/i, '') // trailing "- GA4" / "– GA4" etc.
    .replace(/^www\./, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Prop {
  name: string;
  displayName: string;
  createTime: string;
  account: string;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: website } = await service
    .from('sq_websites')
    .select('ga_refresh_token')
    .not('ga_refresh_token', 'is', null)
    .limit(1)
    .single();
  if (!website?.ga_refresh_token) return NextResponse.json({ error: 'Kein verbundener GA-Zugang.' }, { status: 404 });

  try {
    const accessToken = await refreshAccessToken(website.ga_refresh_token);

    // 1. Fetch every property in every account.
    const allProps: Prop[] = [];
    for (const account of ACCOUNTS) {
      let pageToken: string | undefined;
      do {
        const url = new URL(`${GA_ADMIN_API}/properties`);
        url.searchParams.set('filter', `parent:${account}`);
        url.searchParams.set('pageSize', '200');
        if (pageToken) url.searchParams.set('pageToken', pageToken);
        const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) continue; // skip accounts we can't read rather than aborting the whole scan
        for (const p of data.properties || []) allProps.push({ ...p, account });
        pageToken = data.nextPageToken;
      } while (pageToken);
    }

    // 2. Group by account + normalized name.
    const groups = new Map<string, Prop[]>();
    for (const p of allProps) {
      const key = `${p.account}::${normalizeName(p.displayName)}`;
      const arr = groups.get(key) || [];
      arr.push(p);
      groups.set(key, arr);
    }
    const dupGroups = [...groups.values()].filter(g => g.length > 1);
    const dupMembers = dupGroups.flat();

    // 3. Check each duplicate-group member for whether it EVER had any data (wide range).
    const hasData = new Map<string, boolean>();
    const CONCURRENCY = 6;
    let cursor = 0;
    async function worker() {
      while (cursor < dupMembers.length) {
        const p = dupMembers[cursor++];
        try {
          const res = await fetch(`${GA_DATA_API}/${p.name}:runReport`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dateRanges: [{ startDate: '2015-01-01', endDate: 'today' }],
              metrics: [{ name: 'sessions' }],
              limit: 1,
            }),
          });
          const data = await res.json().catch(() => ({}));
          hasData.set(p.name, (data.rowCount || 0) > 0);
        } catch {
          hasData.set(p.name, true); // unknown -> treat as "has data" so we never delete it by mistake
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    // 4. Classify each group: safe-delete candidates vs ambiguous.
    const deleteCandidates: { property: string; displayName: string; account: string; createTime: string; keptSibling: string }[] = [];
    const ambiguous: { account: string; members: { property: string; displayName: string; createTime: string; hasData: boolean }[] }[] = [];

    for (const group of dupGroups) {
      const withData = group.filter(p => hasData.get(p.name));
      const withoutData = group.filter(p => !hasData.get(p.name));
      if (withData.length === 1 && withoutData.length >= 1) {
        for (const empty of withoutData) {
          deleteCandidates.push({
            property: empty.name,
            displayName: empty.displayName,
            account: empty.account,
            createTime: empty.createTime,
            keptSibling: withData[0].name,
          });
        }
      } else {
        ambiguous.push({
          account: group[0].account,
          members: group.map(p => ({ property: p.name, displayName: p.displayName, createTime: p.createTime, hasData: !!hasData.get(p.name) })),
        });
      }
    }

    return NextResponse.json({
      totalPropertiesScanned: allProps.length,
      duplicateGroupsFound: dupGroups.length,
      deleteCandidates,
      ambiguousGroups: ambiguous,
    });
  } catch (e) {
    console.error('ga-cleanup-scan error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
