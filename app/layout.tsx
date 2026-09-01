import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://suchmaschinen.pro'),
  title: {
    default: 'suchmaschinen.pro — SEO-Content, der wirklich indexiert wird',
    template: '%s | suchmaschinen.pro',
  },
  description: 'Automatisch generierte, thematisch passende Artikel — direkt auf Ihrer eigenen Domain veröffentlicht statt auf einer isolierten Subdomain. Für echte Sichtbarkeit statt leerer Impressionen.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'suchmaschinen.pro',
    title: 'suchmaschinen.pro — SEO-Content, der wirklich indexiert wird',
    description: 'Automatisch generierte Artikel, nativ auf Ihrer eigenen Domain veröffentlicht — für echte Google-Sichtbarkeit statt leerer Impressionen.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
