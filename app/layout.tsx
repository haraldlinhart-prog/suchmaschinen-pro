import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getLocale, englishHomeHref } from '@/lib/seo';

// Self-hosted at build time by next/font — the visitor's browser makes no request to Google Fonts.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

// Defaults only. Every public page sets its own canonical/hreflang via pageMetadata()
// (lib/seo.ts) — a canonical here would be inherited by every page and point them all
// at the homepage.
const metadataByLocale: Record<'de' | 'en', Metadata> = {
  de: {
    metadataBase: new URL('https://www.suchmaschinen.pro'),
    title: {
      default: 'suchmaschinen.pro — SEO-Content, der wirklich indexiert wird',
      template: '%s | suchmaschinen.pro',
    },
    description: 'Automatisch generierte, thematisch passende Artikel — direkt auf Ihrer eigenen Domain veröffentlicht statt auf einer isolierten Subdomain. Für echte Sichtbarkeit statt leerer Impressionen.',
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
  },
  en: {
    metadataBase: new URL('https://www.search-engines.pro'),
    title: {
      default: 'search-engines.pro — SEO content that actually gets indexed',
      template: '%s | search-engines.pro',
    },
    description: 'Automatically generated, topically relevant articles — published directly on your own domain instead of an isolated subdomain. Real visibility, not empty impressions.',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: 'search-engines.pro',
      title: 'search-engines.pro — SEO content that actually gets indexed',
      description: 'Automatically generated articles, published natively on your own domain — for real Google visibility instead of empty impressions.',
      images: [{ url: '/og-image-en.png', width: 1200, height: 630, alt: 'search-engines.pro — Articles Google actually indexes.' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'search-engines.pro — SEO content that actually gets indexed',
      description: 'Automatically generated articles, published natively on your own domain — for real Google visibility instead of empty impressions.',
      images: ['/og-image-en.png'],
    },
    robots: { index: true, follow: true },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadataByLocale[await getLocale()];
}

const jsonLdByLocale: Record<'de' | 'en', object> = {
  de: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'suchmaschinen.pro',
        url: 'https://www.suchmaschinen.pro',
        logo: 'https://www.suchmaschinen.pro/og-image.png',
        description: 'Automatisch generierte, thematisch passende SEO-Artikel, veröffentlicht direkt auf der eigenen Domain des Kunden statt auf einer isolierten Subdomain.',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'suchmaschinen.pro',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://www.suchmaschinen.pro',
        inLanguage: 'de',
        description: 'Analysiert Websites, findet relevante Suchbegriffe und veröffentlicht automatisch generierte Artikel nativ auf der eigenen Domain — für echte Indexierbarkeit statt reiner Impressionen ohne Klicks.',
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Basic', price: '19', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Premium', price: '49', priceCurrency: 'EUR' },
        ],
      },
    ],
  },
  en: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'search-engines.pro',
        url: 'https://www.search-engines.pro',
        logo: 'https://www.search-engines.pro/og-image-en.png',
        description: 'Automatically generated, topically relevant SEO articles, published directly on the customer’s own domain instead of an isolated subdomain.',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'search-engines.pro',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://www.search-engines.pro',
        inLanguage: 'en',
        description: 'Analyzes websites, finds relevant search terms, and publishes automatically generated articles natively on the customer’s own domain — for real indexability instead of impressions without clicks.',
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Basic', price: '19', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Pro', price: '29', priceCurrency: 'EUR' },
          { '@type': 'Offer', name: 'Premium', price: '49', priceCurrency: 'EUR' },
        ],
      },
    ],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const enHome = await englishHomeHref();
  const jsonLd = jsonLdByLocale[locale];

  return (
    <html lang={locale} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header locale={locale} enHome={enHome} />
        {children}
        {/* <!-- WEBMASTER_PLUS_BADGE:START --> */}
        <div dangerouslySetInnerHTML={{__html: "<div style=\"text-align:center;margin:1.5rem auto;\">\n  <a href=\"https://webmaster.plus\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display:inline-block;\">\n    <img src=\"https://news.pan21.com/webmaster-plus-badge.gif\" alt=\"This website is powered by Webmaster.PLUS\" width=\"320\" height=\"80\" style=\"max-width:100%;height:auto;display:block;margin:0 auto;\">\n  </a>\n</div>"}} />
        {/* <!-- WEBMASTER_PLUS_BADGE:END --> */}
        <Footer locale={locale} enHome={enHome} />
      </body>
    </html>
  );
}
