// Duplicate-topic guard (27.10.2026). The keyword check only blocked the exact same keyword,
// so near-identical topics went through: "ladezeit messen" / "ladegeschwindigkeit messen",
// "broken link checker" / "linkcheck tool". On 5 sites Conny had to merge 45 articles into
// their main article by hand. Before a keyword is used now:
//   1. topic locks (sq_topic_locks): topics that already have a main article — no new
//      article, the keyword is noted on the lock so the main article can be extended;
//   2. similarity: the keyword is compared with every keyword already used on the same
//      site (published, draft or merged) and with the lock keywords.
//
// Why concept overlap and not embeddings: the keywords are 2–5 words, mostly German
// compounds and synonyms of a few site-specific terms (Ladezeit = Ladegeschwindigkeit =
// PageSpeed; Linkcheck = Link + Checker; tot = kaputt = defekt). A small synonym table plus
// compound splitting catches exactly those, is deterministic, costs no API call and is
// calibrated against the merged pairs (lib/content/topicGuard.testData.ts). Words that appear in most keywords of a site ("link" on
// kaputte-links.de, "mieten" on rentyourcompany.com) say nothing about the topic there and
// are weighted down per site (inverse document frequency). Embeddings would need a second
// provider key and still rate "UG gründen" / "GmbH gründen" as near-identical.
// Pairs that share no words at all ("Investitionen Afrika Mauritius" / "Mauritius
// Finanzzentrum") cannot be caught lexically — those topics belong in sq_topic_locks.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

/** Weighted Jaccard at or above this = same topic. Calibrated 27.10.2026 on the 45 merged pairs
 *  plus the two task examples: 0.45 catches 39 of 47 (all 8 misses share no word and are
 *  covered by topic locks) and flags 18 of 1007 pairs that were kept apart, most of them
 *  near-duplicates too ("GmbH mieten" / "GmbH mieten Erfahrungen"). 0.5: 37/47, 11 flagged;
 *  0.6: 26/47, 2 flagged. A false alarm only skips one suggested keyword, a miss publishes
 *  a duplicate — hence the lower value. */
export const SIMILARITY_THRESHOLD = 0.45;

/** Concept → word roots. A token containing a root counts as that concept, so compounds
 *  ("linkcheck", "ladegeschwindigkeit", "firmengrundung") split into their parts; what is
 *  left of the token ("mantel" in "mantelgesellschaft") stays a term of its own. Roots of
 *  up to 4 characters only match at the start of a token. */
const CONCEPTS: Array<[string, string[]]> = [
  ['speed', ['ladegeschwindigkeit', 'geschwindigkeit', 'ladezeit', 'pagespeed', 'speed', 'performance']],
  ['checker', ['checker', 'tool', 'werkzeug', 'service']],
  ['detect', ['check', 'prufen', 'prufung', 'pruf', 'testen', 'test', 'messen', 'mess', 'analyse', 'analys', 'validierung', 'validier', 'scan', 'finden', 'find', 'aufspuren', 'entdecken', 'erkennen', 'suchen']],
  ['monitor', ['monitoring', 'monitor', 'uberwachung', 'uberwach', 'benachrichtigung', 'automatisch', 'automat', 'alert', 'pflege', 'wartung']],
  ['broken', ['broken', 'defekte', 'defekt', 'kaputte', 'kaputt', 'tote', 'toten', 'fehlerhaft', 'dead']],
  ['link', ['links', 'link', 'urls', 'url', 'verlinkungen', 'verlinkung', 'webadressen', 'webadresse']],
  ['vitals', ['vitals', 'vital', 'cwv']],
  ['found', ['grundung', 'grunden', 'grunde', 'formation', 'setup', 'etablieren']],
  ['limited', ['limited', 'ltd']],
  ['uk', ['uk', 'englische', 'englisch', 'britische', 'britisch']],
  ['ug', ['unternehmergesellschaft', 'ug']],
  ['firm', ['kapitalgesellschaft', 'gesellschaft', 'firma', 'firmen', 'company']],
  ['rent', ['vermietung', 'mieten', 'miete', 'miet']],
  ['nominee', ['nominee', 'treuhandbasis', 'treuhander', 'treuhand']],
  ['director', ['geschaftsfuhrer', 'director']],
  ['address', ['geschaftsadresse', 'adresse', 'briefkasten', 'sitz']],
  ['dta', ['doppelbesteuerungsabkommen', 'dba']],
  ['tax', ['steuern', 'steuer', 'tax']],
  ['gbc', ['gbc']],
  ['cost', ['kosten', 'preise', 'preis', 'gebuhren', 'kostet']],
];

/** Words that say little about the topic: they still count, but with a low weight. */
const GENERIC = new Set([
  'website', 'webseite', 'seite', 'online', 'kostenlos', 'gratis', 'deutsch', 'deutschland',
  'professionell', 'legal', 'flexibel', 'flexible',
  'beratung', 'guide', 'leitfaden', 'tipps', 'unternehmen', 'effective', 'offshore', 'mauritius',
  'geschaftlich', 'losung', 'betreiben', 'auf', 'zeit',
]);
const GENERIC_WEIGHT = 0.25;

const STOP = new Set([
  'der', 'die', 'das', 'und', 'oder', 'in', 'im', 'fur', 'mit', 'von', 'zu', 'zum', 'zur', 'ein',
  'eine', 'einer', 'eines', 'den', 'dem', 'des', 'wie', 'was', 'ist', 'sind', 'bei', 'an', 'als',
  'aus', 'so', 'sie', 'ihr', 'ihre', 'ich', 'man', 'kann', 'nach', 'ohne', 'eigenen', 'vs', 'the',
  'and', 'of', 'to', 'a', 'for', 'how', 'what', 'is', 'de', 'com', 'e', 'mail',
]);

export function foldText(s: string): string {
  return (s || '').toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Whole-token shortcuts: an LTD is the British limited; "linkcheck" is a link checker (a product),
// while "check" alone ("pagespeed check") means testing.
const ALIASES: Record<string, string[]> = { ltd: ['limited', 'uk'], linkcheck: ['link', 'checker'], linkchecker: ['link', 'checker'] };

const stem = (w: string) => (w.length > 6 ? w.slice(0, 6) : w);

/** Concepts in a token plus what is left of it (≥ 4 letters) as its own stem. */
function termsOfToken(token: string): string[] {
  if (ALIASES[token]) return ALIASES[token];
  const out: string[] = [];
  let rest = token;
  for (const [concept, roots] of CONCEPTS) {
    const root = roots.find(r => (r.length <= 4 ? rest.startsWith(r) && (rest.length === r.length || r.length >= 3) : rest.includes(r)));
    if (!root) continue;
    out.push(concept);
    rest = rest.replace(root, ' ');
  }
  if (out.length === 0) return [stem(token)];
  for (const part of rest.split(' ')) {
    const p = part.replace(/^s(?=[a-z]{4})/, ''); // Fugen-s: "vorrats|gesellschaft"
    const word = p.replace(/s$/, '');
    if (word.length >= 4 && !STOP.has(word) && !GENERIC.has(word)) out.push(stem(word));
  }
  return out;
}

/** Weighted term bag of a keyword or title (generic words get GENERIC_WEIGHT). */
export function topicTerms(text: string): Map<string, number> {
  const terms = new Map<string, number>();
  const folded = foldText(text).replace(/global business compan(y|ies)/g, 'gbc').replace(/global business/g, 'gbc');
  for (const token of folded.split(/[^a-z0-9]+/)) {
    if (!token || STOP.has(token) || /^\d{1,2}$/.test(token)) continue;
    const raw = token.replace(/^kostenlos\w*/, 'kostenlos');
    // Generic words stay plain words — "kostenloser" must not turn into the concept "cost".
    const generic = GENERIC.has(raw);
    for (const t of generic ? [raw] : termsOfToken(raw)) terms.set(t, Math.max(terms.get(t) ?? 0, generic ? GENERIC_WEIGHT : 1));
  }
  return terms;
}

/** Per-site term weights: a term in most keywords of the site counts little (min 0.2). */
export function siteWeights(corpus: string[]): (term: string) => number {
  const df = new Map<string, number>();
  for (const text of corpus) for (const t of topicTerms(text).keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const n = corpus.length;
  return term => {
    const d = df.get(term) ?? 0;
    if (n < 5 || d <= 1) return 1;
    return Math.max(0.2, Math.min(1, Math.log((n + 1) / d) / Math.log((n + 1) / 2)));
  };
}

/** Weighted Jaccard of the two term bags, 0..1. `weight` = siteWeights() of the site. */
export function topicSimilarity(a: string, b: string, weight: (term: string) => number = () => 1): number {
  const ta = topicTerms(a), tb = topicTerms(b);
  let inter = 0, union = 0;
  for (const k of new Set([...ta.keys(), ...tb.keys()])) {
    const w = weight(k);
    const wa = (ta.get(k) ?? 0) * w, wb = (tb.get(k) ?? 0) * w;
    inter += Math.min(wa, wb);
    union += Math.max(wa, wb);
  }
  return union === 0 ? 0 : inter / union;
}

export interface TopicLock {
  id: string;
  topic: string;
  keywords: string[];
  target_url: string;
}

export interface TopicVerdict {
  ok: boolean;
  /** 'lock' = matches a locked topic, 'similar' = too close to a keyword the site already has. */
  reason?: 'lock' | 'similar';
  /** The lock keyword or existing keyword it collides with. */
  match?: string;
  lockId?: string;
  targetUrl?: string;
  score?: number;
}

/**
 * Decides whether a new article may be written for `keyword` on a site. `existing` = every
 * keyword the site already used (any status, merged included); `locks` = the site's topic locks.
 */
export function checkTopic(keyword: string, existing: string[], locks: TopicLock[], threshold = SIMILARITY_THRESHOLD): TopicVerdict {
  const norm = (s: string) => foldText(s).replace(/\s+/g, ' ').trim();
  const lockKeywords = locks.flatMap(l => l.keywords);
  const weight = siteWeights([...existing, ...lockKeywords]);
  // The best-matching lock wins: "tote links finden" also resembles "links prüfen" of the
  // link-checker lock, but belongs to the lock that lists it.
  let lockHit: TopicVerdict | null = null;
  for (const lock of locks) {
    for (const lk of lock.keywords) {
      const score = norm(lk) === norm(keyword) ? 1 : topicSimilarity(keyword, lk, weight);
      if (score >= threshold && score > (lockHit?.score ?? 0)) lockHit = { ok: false, reason: 'lock', match: lk, lockId: lock.id, targetUrl: lock.target_url, score };
    }
  }
  if (lockHit) return lockHit;
  let best: TopicVerdict = { ok: true, score: 0 };
  for (const ek of existing) {
    const score = norm(ek) === norm(keyword) ? 1 : topicSimilarity(keyword, ek, weight);
    if (score >= threshold && score > (best.score ?? 0)) best = { ok: false, reason: 'similar', match: ek, score };
  }
  return best;
}

/** Topic locks of one site. */
export async function loadTopicLocks(supabase: SupabaseLike, websiteId: string): Promise<TopicLock[]> {
  const { data, error } = await supabase
    .from('sq_topic_locks')
    .select('id, topic, keywords, target_url')
    .eq('website_id', websiteId);
  if (error) throw new Error(`loading topic locks failed: ${error.message}`);
  return (data || []) as TopicLock[];
}

/** Notes a blocked keyword on its lock, so whoever extends the main article sees the demand. */
export async function recordLockHit(supabase: SupabaseLike, lockId: string, keyword: string): Promise<void> {
  const { error } = await supabase.rpc('sq_topic_lock_add_keyword', { p_lock_id: lockId, p_keyword: keyword });
  if (error) console.error(`recordLockHit failed for lock ${lockId}`, error);
}
