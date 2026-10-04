// Network-wide duplicate avoidance (04.10.2026). All sites of one account (e.g. Harald's
// ~55 PAN21 network sites) used to pick keywords and titles independently: "UG gründen" was
// written on 7 sites, "GmbH gründen" on 7, and 7 article titles were word-for-word
// identical across sites — the sites then compete with each other on Google. Keywords
// already covered by ANOTHER site of the same account are skipped, the keyword AI is told
// which ones are taken, and titles must differ from every title in the account.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

export function normText(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export interface NetworkUsage {
  /** Normalized keywords used by OTHER sites of the account (published or draft). */
  otherKeywords: Set<string>;
  /** The same keywords in their original spelling, newest first (for the AI prompt). */
  otherKeywordList: string[];
  /** All titles of the account, including this site (published or draft). */
  titles: string[];
}

export async function networkUsage(supabase: SupabaseLike, userId: string, websiteId: string): Promise<NetworkUsage> {
  const { data } = await supabase
    .from('sq_articles')
    .select('keyword, title, website_id')
    .eq('user_id', userId)
    .in('status', ['published', 'draft'])
    .order('created_at', { ascending: false })
    .limit(5000);
  const rows = (data || []) as Array<{ keyword: string | null; title: string | null; website_id: string }>;
  const otherKeywords = new Set<string>();
  const otherKeywordList: string[] = [];
  const titles: string[] = [];
  for (const r of rows) {
    if (r.title) titles.push(r.title);
    if (r.website_id !== websiteId && r.keyword) {
      const n = normText(r.keyword);
      if (!otherKeywords.has(n)) {
        otherKeywords.add(n);
        otherKeywordList.push(r.keyword);
      }
    }
  }
  return { otherKeywords, otherKeywordList, titles };
}

/** Titles that share a meaningful word with the keyword — what the article AI must not repeat. */
export function titlesNear(keyword: string, titles: string[], max = 40): string[] {
  const words = normText(keyword).split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 4);
  if (words.length === 0) return [];
  const out: string[] = [];
  for (const t of titles) {
    const nt = normText(t);
    if (words.some(w => nt.includes(w)) && !out.some(o => normText(o) === nt)) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}
