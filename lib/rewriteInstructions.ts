import type { HostingPlatform } from '@/types';

export function rewriteInstructions(platform: HostingPlatform, publishPath: string, publicSlug: string): { title: string; steps: string[]; snippet?: string } {
  const cleanPath = publishPath.startsWith('/') ? publishPath : `/${publishPath}`;
  const target = `https://suchmaschinen.pro/b/${publicSlug}`;

  switch (platform) {
    case 'network':
      return {
        title: 'Kein Zusatzschritt nötig',
        steps: [
          'Ihre Website läuft im PAN21-Netzwerk (GitHub + Vercel). Neu veröffentlichte Artikel werden direkt in Ihr Repository committet und erscheinen automatisch unter Ihrer eigenen Domain — ganz ohne Weiterleitung.',
        ],
      };
    case 'vercel':
      return {
        title: 'Rewrite-Regel in vercel.json',
        steps: [
          `Fügen Sie in der \`vercel.json\` Ihres Projekts folgende Regel hinzu (oder ergänzen Sie den bestehenden "rewrites"-Block):`,
        ],
        snippet: `{
  "rewrites": [
    { "source": "${cleanPath}", "destination": "${target}" },
    { "source": "${cleanPath}:path*", "destination": "${target}/:path*" }
  ]
}`,
      };
    case 'netlify':
      return {
        title: 'Redirect-Regel in netlify.toml',
        steps: [
          'Fügen Sie in Ihrer `netlify.toml` folgenden Eintrag hinzu:',
        ],
        snippet: `[[redirects]]
  from = "${cleanPath}*"
  to = "${target}/:splat"
  status = 200`,
      };
    case 'apache':
      return {
        title: '.htaccess-Regel',
        steps: [
          'Fügen Sie in der `.htaccess` im Wurzelverzeichnis Ihrer Website folgende Zeilen hinzu:',
        ],
        snippet: `RewriteEngine On
RewriteRule ^${cleanPath.replace(/^\//, '').replace(/\/$/, '')}/?(.*)$ ${target}/$1 [P,L]`,
      };
    case 'wordpress':
      return {
        title: 'Weiterleitung per Plugin',
        steps: [
          'Installieren Sie ein einfaches Redirect-Plugin (z. B. "Redirection", kostenlos im WordPress-Verzeichnis).',
          `Legen Sie eine neue Weiterleitungsregel an: Quelle "${cleanPath}(.*)" → Ziel "${target}/$1", Typ: 200 (nicht 301).`,
        ],
      };
    default:
      return {
        title: 'Weiterleitung einrichten',
        steps: [
          `Richten Sie bei Ihrem Hoster eine Weiterleitung (Proxy/Rewrite, nicht 301-Redirect) von "${cleanPath}" auf "${target}" ein.`,
          'Falls Sie nicht wissen, wie das bei Ihrem Anbieter geht — schreiben Sie uns kurz, welchen Hoster Sie nutzen, dann sagen wir Ihnen genau Bescheid.',
        ],
      };
  }
}
