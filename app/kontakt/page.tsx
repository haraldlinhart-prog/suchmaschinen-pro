import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';
import { getLocale, pageMetadata } from '@/lib/seo';

// Served as /kontakt on suchmaschinen.pro and as /contact on search-engines.pro (middleware.ts).
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === 'en'
    ? pageMetadata('contact', 'en', { title: 'Contact', description: 'Questions about search-engines.pro, our plans or your website? Send us a message — we will get back to you promptly.' })
    : pageMetadata('contact', 'de', { title: 'Kontakt', description: 'Fragen zu suchmaschinen.pro, zu den Tarifen oder zu Ihrer Website? Schreiben Sie uns — wir melden uns zeitnah.' });
}

export default async function KontaktPage() {
  const isEn = (await getLocale()) === 'en';
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="section-label">{isEn ? 'Contact' : 'Kontakt'}</div>
        <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)' }}>
          {isEn ? 'Talk to us' : 'Sprechen Sie mit uns'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
          {isEn
            ? 'Questions about search-engines.pro, our plans or your website? Send us a message.'
            : 'Fragen zu suchmaschinen.pro, zu den Tarifen oder zu Ihrer Website? Schreiben Sie uns.'}
        </p>
      </div>
      <ContactForm locale={isEn ? 'en' : 'de'} />
    </div>
  );
}
