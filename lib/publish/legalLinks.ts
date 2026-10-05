// Impressum-/Datenschutz-Links der Website finden, damit jeder veröffentlichte Artikel
// sie im Footer verlinkt (05.10.2026: Artikelseiten hatten bisher gar keine Rechtslinks).
// Gesucht wird auf der Startseite (bzw. /en bei englischen Artikeln); Links auf das Tool
// impressum-free.de zählen nicht.

export interface LegalLinks {
  impressum?: string;
  datenschutz?: string;
}

const IMPRINT = /impressum|imprint|legal-notice|legal_notice/i;
const PRIVACY = /datenschutz|privacy/i;

function decode(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
}

function absolute(origin: string, href: string): string | null {
  if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return null;
  try {
    return new URL(href, origin + '/').toString();
  } catch {
    return null;
  }
}

/** Liest die <a>-Links einer Seite und gibt die ersten Treffer für Impressum und Datenschutz zurück. */
export function extractLegalLinks(html: string, origin: string): LegalLinks {
  const out: LegalLinks = {};
  const withoutScripts = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  const anchor = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchor.exec(withoutScripts))) {
    const href = decode(m[1]);
    if (/impressum-free\./i.test(href)) continue;
    const text = m[2].replace(/<[^>]+>/g, ' ');
    const url = absolute(origin, href);
    if (!url) continue;
    if (!out.impressum && (IMPRINT.test(href) || /\b(Impressum|Imprint|Legal notice)\b/i.test(text))) out.impressum = url;
    else if (!out.datenschutz && (PRIVACY.test(href) || /\b(Datenschutz|Privacy)\b/i.test(text))) out.datenschutz = url;
    if (out.impressum && out.datenschutz) break;
  }
  return out;
}

export async function discoverLegalLinks(origin: string, lang: string): Promise<LegalLinks> {
  const pages = lang === 'en' ? [`${origin}/en`, `${origin}/`] : [`${origin}/`];
  const found: LegalLinks = {};
  for (const page of pages) {
    try {
      const res = await fetch(page, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const links = extractLegalLinks(await res.text(), origin);
      found.impressum ??= links.impressum;
      found.datenschutz ??= links.datenschutz;
      if (found.impressum && found.datenschutz) break;
    } catch {
      // Startseite nicht erreichbar: Footer fällt auf den Link zur Startseite zurück
    }
  }
  return found;
}
