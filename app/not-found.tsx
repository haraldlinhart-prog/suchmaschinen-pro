import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, englishHomeHref } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const isEn = (await getLocale()) === 'en';
  return { title: isEn ? 'Page not found' : 'Seite nicht gefunden', robots: { index: false, follow: true } };
}

export default async function NotFound() {
  const isEn = (await getLocale()) === 'en';
  const home = isEn ? await englishHomeHref() : '/';
  return (
    <section style={{ maxWidth: 620, margin: '0 auto', padding: '5rem 1.5rem 3rem', textAlign: 'center' }}>
      <div className="section-label">{isEn ? 'Error 404' : 'Fehler 404'}</div>
      <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
      <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', color: 'var(--ink)', margin: '0 0 1rem' }}>
        {isEn ? 'This page does not exist.' : 'Diese Seite gibt es nicht.'}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.7, margin: '0 0 2rem' }}>
        {isEn
          ? 'The link may be outdated or the address may contain a typo. These pages will help you move on:'
          : 'Möglicherweise ist der Link veraltet oder die Adresse enthält einen Tippfehler. Hier geht es weiter:'}
      </p>
      <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href={home} className="btn-emerald">{isEn ? 'Go to homepage' : 'Zur Startseite'}</Link>
        <Link href={isEn ? '/tour' : '/rundgang'} className="btn-outline">{isEn ? 'Take the tour' : 'Zum Rundgang'}</Link>
      </div>
    </section>
  );
}
