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

export interface RelatedKeyword {
  keyword: string;
  volume: number;
  cpc: number | null;
}

/**
 * Related search terms with volume (Google Ads "keywords for keywords"), used to offer
 * better alternatives when a customer's own keyword has little demand. ~0.075 $ per call.
 */
export async function getRelatedKeywords(keyword: string, locationCode = 2276, languageCode = 'de'): Promise<RelatedKeyword[]> {
  if (!volumeProviderConfigured()) return [];
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64');
  const res = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ keywords: [keyword], location_code: locationCode, language_code: languageCode, sort_by: 'search_volume' }]),
  });
  const data = await res.json().catch(() => null);
  const task = data?.tasks?.[0];
  if (!res.ok || !task || task.status_code >= 40000) {
    console.error('DataForSEO related keywords error:', data?.status_message || task?.status_message || res.status);
    return [];
  }
  const rows: Array<{ keyword: string; search_volume: number | null; cpc: number | null }> = task.result || [];
  const own = clean(keyword);
  const out = rows
    .filter(r => r.keyword && clean(r.keyword) !== own && (r.search_volume ?? 0) > 0)
    .map(r => ({ keyword: r.keyword, volume: r.search_volume ?? 0, cpc: r.cpc ?? null }));

  // Cache their volumes too — clicking an alternative should not cost a second lookup.
  if (out.length) {
    const service = createServiceClient();
    const now = new Date().toISOString();
    await service.from('sq_keyword_volumes').upsert(out.slice(0, 200).map(r => ({
      keyword: clean(r.keyword), location_code: locationCode, language_code: languageCode,
      search_volume: r.volume, cpc: r.cpc, competition: null, fetched_at: now,
    })));
  }
  return out;
}

// Typical organic click-through rate by Google position (rounded industry averages,
// desktop+mobile). Only used for an order-of-magnitude estimate, shown as "ca.".
const CTR_BY_POSITION: Record<number, number> = { 1: 0.28, 2: 0.15, 3: 0.11, 5: 0.06, 10: 0.025, 20: 0.008 };

export interface KeywordAnalysis {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  scenarios: Array<{ position: number; clicks: number; adsValue: number | null }>;
  verdict: { level: 'good' | 'niche' | 'weak' | 'none' | 'unknown'; text: string };
  related: RelatedKeyword[];
}

export async function analyzeKeyword(keyword: string): Promise<KeywordAnalysis> {
  const vols = await getKeywordVolumes([keyword]);
  const info = vols[clean(keyword)];
  const volume = info?.volume ?? null;
  const cpc = info?.cpc !== null && info?.cpc !== undefined ? Number(info.cpc) : null;

  const scenarios = Object.entries(CTR_BY_POSITION).map(([pos, ctr]) => {
    const clicks = volume ? Math.round(volume * ctr * 10) / 10 : 0;
    return { position: Number(pos), clicks, adsValue: cpc ? Math.round(clicks * cpc * 100) / 100 : null };
  });

  let verdict: KeywordAnalysis['verdict'];
  if (volume === null) {
    verdict = { level: 'unknown', text: 'Für diesen Begriff liegen keine Google-Daten vor.' };
  } else if (volume === 0) {
    verdict = { level: 'none', text: 'Wird bei Google praktisch nicht gesucht – ein Artikel dazu bringt kaum Besucher. Nehmen Sie besser einen der Alternativbegriffe.' };
  } else {
    const top3Value = (volume * CTR_BY_POSITION[3]) * (cpc || 0);
    if (volume >= 100 || top3Value >= 50) {
      verdict = { level: 'good', text: 'Lohnt sich: spürbare Nachfrage' + ((cpc || 0) >= 3 ? ' und wertvolle Besucher.' : '.') };
    } else if (volume >= 20 || (cpc || 0) >= 5) {
      verdict = { level: 'niche', text: (cpc || 0) >= 5 ? 'Kleine Nische, aber wertvolle Besucher – lohnt sich.' : 'Kleine Nische – lohnt sich als Ergänzung.' };
    } else {
      verdict = { level: 'weak', text: 'Sehr geringe Nachfrage – nur sinnvoll, wenn der Begriff genau Ihr Angebot trifft. Prüfen Sie die Alternativen.' };
    }
  }

  const related = verdict.level === 'good' ? [] : (await getRelatedKeywords(keyword)).slice(0, 6);
  return { keyword, volume, cpc, scenarios, verdict, related };
}
