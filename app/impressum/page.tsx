import type { Metadata } from 'next';
import { getLocale, pageMetadata } from '@/lib/seo';

// Served as /impressum on suchmaschinen.pro and as /legal-notice on search-engines.pro (middleware.ts).
export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === 'en'
    ? pageMetadata('legal', 'en', { title: 'Legal notice', description: 'Legal notice for search-engines.pro, a service by PAN21.COM Corporate Consultants Ltd.', noindex: true })
    : pageMetadata('legal', 'de', { title: 'Impressum', description: 'Impressum von suchmaschinen.pro, einem Angebot der PAN21.COM Corporate Consultants Ltd.', noindex: true });
}

const h2 = { fontSize: '1rem', marginTop: '1.75rem', marginBottom: '0.5rem', color: 'var(--ink)' } as const;
const line = { color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' } as const;

export default async function ImpressumPage() {
  const isEn = (await getLocale()) === 'en';
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginBottom: '2rem' }}>{isEn ? 'Legal notice' : 'Impressum'}</h1>

      <h2 style={h2}>{isEn ? 'Information pursuant to § 5 DDG (German Digital Services Act)' : 'Angaben gemäß § 5 DDG'}</h2>
      <p style={line}>PAN21.COM Corporate Consultants Ltd</p>
      <p style={line}>61 Bridge Street</p>
      <p style={line}>Kington, Herefordshire HR5 3DJ</p>
      <p style={line}>United Kingdom</p>
      <p style={line}>Company No. 16117708</p>

      <h2 style={h2}>{isEn ? 'Director' : 'Geschäftsführer'}</h2>
      <p style={line}>Harald Linhart</p>

      <h2 style={h2}>{isEn ? 'Contact' : 'Kontakt'}</h2>
      <p style={line}>
        {isEn ? 'Email' : 'E-Mail'}: <a href="mailto:suchmaschinen@pan21.com" style={{ color: 'var(--emerald)' }}>suchmaschinen@pan21.com</a>
      </p>

      <h2 style={h2}>{isEn ? 'Responsible for content pursuant to § 18 (2) MStV' : 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV'}</h2>
      <p style={line}>{isEn ? 'Harald Linhart, address as above' : 'Harald Linhart, Anschrift wie oben'}</p>
    </div>
  );
}
