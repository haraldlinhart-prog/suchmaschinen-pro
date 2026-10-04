import type { Metadata } from 'next';
import { getLocale, pageMetadata } from '@/lib/seo';

// Served as /impressum on suchmaschinen.pro and as /legal-notice on search-engines.pro (middleware.ts).
export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === 'en'
    ? pageMetadata('legal', 'en', { title: 'Legal notice', description: 'Legal notice for search-engines.pro, a service by PAN21.com International LLC.', noindex: true })
    : pageMetadata('legal', 'de', { title: 'Impressum', description: 'Impressum von suchmaschinen.pro, einem Angebot der PAN21.com International LLC.', noindex: true });
}

const h2 = { fontSize: '1rem', marginTop: '1.75rem', marginBottom: '0.5rem', color: 'var(--ink)' } as const;
const line = { color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' } as const;

export default async function ImpressumPage() {
  const isEn = (await getLocale()) === 'en';
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginBottom: '2rem' }}>{isEn ? 'Legal notice' : 'Impressum'}</h1>

      <h2 style={h2}>{isEn ? 'Information pursuant to § 5 DDG (German Digital Services Act)' : 'Angaben gemäß § 5 DDG'}</h2>
      <p style={line}>PAN21.com International LLC</p>
      <p style={line}>7533 South Center View CT, STE R</p>
      <p style={line}>84084 West Jordan, Utah</p>
      <p style={line}>USA</p>
      <p style={line}>{isEn ? 'Incorporated in Utah, USA, registration no. 14723637-0163' : 'Gegründet im US-Bundesstaat Utah, Registrierungsnummer 14723637-0163'}</p>

      <h2 style={h2}>{isEn ? 'Represented by' : 'Vertreten durch'}</h2>
      <p style={line}>Harald Linhart</p>

      <h2 style={h2}>{isEn ? 'Contact' : 'Kontakt'}</h2>
      <p style={line}>{isEn ? 'Phone' : 'Telefon'}: <a href="tel:+493056844500" style={{ color: 'var(--emerald)' }}>+49 30 5684450-0</a></p>
      <p style={line}>
        {isEn ? 'Email' : 'E-Mail'}: <a href="mailto:suchmaschinen@pan21.com" style={{ color: 'var(--emerald)' }}>suchmaschinen@pan21.com</a>
      </p>

      <h2 style={h2}>{isEn ? 'Responsible for content pursuant to § 18 (2) MStV' : 'Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV'}</h2>
      <p style={line}>{isEn ? 'Harald Linhart, address as above' : 'Harald Linhart, Anschrift wie oben'}</p>
    </div>
  );
}
