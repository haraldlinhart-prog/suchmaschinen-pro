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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'suchmaschinen.pro — Artikel, die Google tatsächlich indexiert.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'suchmaschinen.pro — SEO-Content, der wirklich indexiert wird',
    description: 'Automatisch generierte Artikel, nativ auf Ihrer eigenen Domain veröffentlicht — für echte Google-Sichtbarkeit statt leerer Impressionen.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'suchmaschinen.pro',
      url: 'https://suchmaschinen.pro',
      logo: 'https://suchmaschinen.pro/og-image.png',
      description: 'Automatisch generierte, thematisch passende SEO-Artikel, veröffentlicht direkt auf der eigenen Domain des Kunden statt auf einer isolierten Subdomain.',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'suchmaschinen.pro',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://suchmaschinen.pro',
      description: 'Analysiert Websites, findet relevante Suchbegriffe und veröffentlicht automatisch generierte Artikel nativ auf der eigenen Domain — für echte Indexierbarkeit statt reiner Impressionen ohne Klicks.',
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR' },
        { '@type': 'Offer', name: 'Basic', price: '19', priceCurrency: 'EUR' },
        { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'EUR' },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
