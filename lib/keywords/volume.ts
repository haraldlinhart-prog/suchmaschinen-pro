import { createServiceClient } from '@/lib/supabase/service';

// Monthly Google search volume for keywords (Germany/German by default).
// Source: DataForSEO's Google Ads endpoint — pay-per-use, no subscription (chat 26.09.26).
// Only active when DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD are set; results are cached
// for 30 days in sq_keyword_volumes so each keyword is paid for at most once a month.

export interface KeywordVolume {
  volume: number | null;
  cpc: number | null;
  competition: string | null;
}

const CACHE_DAYS = 30;

export function volumeProviderConfigured(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

function clean(k: string): string {
  return k.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function getKeywordVolumes(
  keywords: string[],
  locationCode = 2276,
  languageCode = 'de'
): Promise<Record<string, KeywordVolume>> {
  const wanted = [...new Set(keywords.map(clean).filter(k => k && k.length <= 80 && k.split(' ').length <= 10))];
  const out: Record<string, KeywordVolume> = {};
  if (wanted.length === 0) return out;

  const service = createServiceClient();
  const since = new Date(Date.now() - CACHE_DAYS * 86400000).toISOString();
  const { data: cached } = await service
    .from('sq_keyword_volumes')
    .select('keyword, search_volume, cpc, competition')
    .in('keyword', wanted)
    .eq('location_code', locationCode)
    .eq('language_code', languageCode)
    .gte('fetched_at', since);
  for (const r of cached || []) out[r.keyword] = { volume: r.search_volume, cpc: r.cpc, competition: r.competition };

  const missing = wanted.filter(k => !(k in out));
  if (missing.length === 0 || !volumeProviderConfigured()) return out;

  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  for (let i = 0; i < missing.length; i += 1000) {
    const batch = missing.slice(i, i + 1000);
    const res = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{ keywords: batch, location_code: locationCode, language_code: languageCode }]),
    });
    const data = await res.json().catch(() => null);
    const task = data?.tasks?.[0];
    if (!res.ok || !task || task.status_code >= 40000) {
      console.error('DataForSEO search volume error:', data?.status_message || task?.status_message || res.status);
      continue;
    }
    const rows: Array<{ keyword: string; search_volume: number | null; cpc: number | null; competition: string | null }> = task.result || [];
    const now = new Date().toISOString();
    const upserts = batch.map(k => {
      const r = rows.find(x => clean(x.keyword) === k);
      const v = { volume: r?.search_volume ?? 0, cpc: r?.cpc ?? null, competition: r?.competition ?? null };
      out[k] = v;
      return { keyword: k, location_code: locationCode, language_code: languageCode, search_volume: v.volume, cpc: v.cpc, competition: v.competition, fetched_at: now };
    });
    await service.from('sq_keyword_volumes').upsert(upserts);
  }
  return out;
}
