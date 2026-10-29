// `npm test` — menu link insertion for Next.js sites (navLink.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { insertNavComponent, buildSections, buildComponentSource, rankNavCandidates, relativeImport, navLinksToBlog } from './navLink.ts';

const SHELL = `import Link from 'next/link';
import type { ReactNode } from 'react';

export function Shell({ locale }: { locale: string }) {
  return (
    <header className="site-header">
      <Link href="/" className="logo">x</Link>
      <nav>
        <Link href={routes.days[locale]}>{t.nav.countdown}</Link>
        <Link href={routes.when[locale]}>{t.nav.when}</Link>
        <Link href={alternates[other]} hrefLang={other} className="lang-switch">
          {t.nav.switchLabel}
        </Link>
      </nav>
    </header>
  );
}
`;

test('christmas.world Shell: inserted at position 2 with import', () => {
  const r = insertNavComponent(SHELL, '/blog/', './SuchmaschinenBlogLink');
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.match(r.source, /import SuchmaschinenBlogLink from '\.\/SuchmaschinenBlogLink';/);
  const nav = r.source.slice(r.source.indexOf('<nav>'), r.source.indexOf('</nav>'));
  const iCountdown = nav.indexOf('t.nav.countdown');
  const iBlog = nav.indexOf('<SuchmaschinenBlogLink');
  const iWhen = nav.indexOf('t.nav.when');
  assert.ok(iCountdown < iBlog && iBlog < iWhen);
  // Idempotent
  const again = insertNavComponent(r.source, '/blog/', './SuchmaschinenBlogLink');
  assert.deepEqual(again, { ok: false, reason: 'present' });
});

test('mapped links: inserted before </nav>, not inside the map', () => {
  const src = `'use client';
import Link from 'next/link';
export default function H() {
  return (
    <nav className="menu">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="item">{l.label}</Link>
      ))}
    </nav>
  );
}
`;
  const r = insertNavComponent(src, '/blog/', '../SuchmaschinenBlogLink');
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.ok(r.source.startsWith("'use client';\nimport Link"));
  const iMapEnd = r.source.indexOf('))}');
  assert.ok(r.source.indexOf('<SuchmaschinenBlogLink') > iMapEnd);
});

test('existing manual blog link is respected', () => {
  const src = `export default function H(){return(<nav><a href="/">Home</a><a href="/blog/">Blog</a></nav>)}`;
  assert.deepEqual(insertNavComponent(src, '/blog/', './x'), { ok: false, reason: 'present' });
  assert.equal(navLinksToBlog(`<Link href={'/en/blog/'}>`, '/en/blog/'), true);
});

test('className of the first plain link is copied', () => {
  const src = `import Link from 'next/link';\nexport default function H(){return(\n  <nav>\n    <a href="/" className="brand">B</a>\n    <a href="/x" className="nav-link">X</a>\n  </nav>\n)}`;
  const r = insertNavComponent(src, '/blog/', './c');
  assert.equal(r.ok, true);
  if (r.ok) assert.match(r.source, /<SuchmaschinenBlogLink className="nav-link" \/>/);
});

test('sections and component source', () => {
  const s = buildSections([{ lang: 'en', path: '/blog/' }, { lang: 'de', path: '/de/blog/' }]);
  assert.deepEqual(s.map(x => [x.prefix, x.href, x.label]), [[null, '/blog/', 'Blog'], ['de', '/de/blog/', 'Ratgeber']]);
  const tsx = buildComponentSource(s, true);
  assert.match(tsx, /^'use client';/);
  assert.match(tsx, /className\?: string/);
});

test('candidate ranking and relative import', () => {
  const ranked = rankNavCandidates(['app/page.tsx', 'components/Shell.tsx', 'components/pages/HomePage.tsx', 'components/Header.tsx', 'public/x.tsx', 'lib/layout.tsx']);
  assert.deepEqual(ranked.slice(0, 3), ['components/Header.tsx', 'components/Shell.tsx', 'lib/layout.tsx']);
  assert.equal(relativeImport('components/Shell.tsx', 'components/SuchmaschinenBlogLink.tsx'), './SuchmaschinenBlogLink');
  assert.equal(relativeImport('src/components/layout/Header.tsx', 'src/components/layout/SuchmaschinenBlogLink.tsx'), './SuchmaschinenBlogLink');
});
