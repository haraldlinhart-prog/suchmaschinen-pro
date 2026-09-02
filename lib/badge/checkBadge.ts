const BADGE_MARKER = 'data-suchmaschinen-badge="pro21"';

export async function isBadgeEmbedded(domain: string): Promise<boolean> {
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'suchmaschinen.pro-badge-check/1.0' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const html = await res.text();
    return html.includes(BADGE_MARKER);
  } catch (err) {
    console.error(`Badge check failed for ${domain}`, err);
    return false;
  }
}
