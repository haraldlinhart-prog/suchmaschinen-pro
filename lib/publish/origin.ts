// The origin a site actually serves on (apex vs. www), found by following redirects.
// Canonical tags, sitemaps and links must use it — pointing them at a host that
// redirects makes Google index both hosts (firmenabwicklung.de, chat 26.09.26).
export async function resolveOrigin(domain: string): Promise<string> {
  try {
    const res = await fetch(`https://${domain}/`, { redirect: 'follow' });
    return new URL(res.url).origin;
  } catch {
    return `https://${domain}`;
  }
}
