import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const metadataByLocale: Record<'de' | 'en', Metadata> = {
  de: {
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
  },
  en: {
    metadataBase: new URL('https://search-engines.pro'),
    title: {
      default: 'search-engines.pro — SEO content that actually gets indexed',
      template: '%s | search-engines.pro',
    },
    description: 'Automatically generated, topically relevant articles — published directly on your own domain instead of an isolated subdomain. Real visibility, not empty impressions.',
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: 'search-engines.pro',
      title: 'search-engines.pro — SEO content that actually gets indexed',
      description: 'Automatically generated articles, published natively on your own domain — for real Google visibility instead of empty impressions.',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'search-engines.pro — Articles Google actually indexes.' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'search-engines.pro — SEO content that actually gets indexed',
      description: 'Automatically generated articles, published natively on your own domain — for real Google visibility instead of empty impressions.',
      images: ['/og-image.png'],
    },
    robots: { index: true, follow: true },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await headers()).get('x-locale') === 'en' ? 'en' : 'de';
  return metadataByLocale[locale];
}

const jsonLdByLocale: Record<'de' | 'en', object> = {
  de: {
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
        url: 'https://search-engines.pro',
        logo: 'https://search-engines.pro/og-image.png',
        description: 'Automatically generated, topically relevant SEO articles, published directly on the customer\u2019s own domain instead of an isolated subdomain.',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'search-engines.pro',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://search-engines.pro',
        description: 'Analyzes websites, finds relevant search terms, and publishes automatically generated articles natively on the customer\u2019s own domain — for real indexability instead of impressions without clicks.',
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
  const locale = (await headers()).get('x-locale') === 'en' ? 'en' : 'de';
  const jsonLd = jsonLdByLocale[locale];

  return (
    <html lang={locale}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header locale={locale} />
        {children}
        {/* <!-- WEBMASTER_PLUS_BADGE:START --> */}
        <div dangerouslySetInnerHTML={{__html: "<div style=\"text-align:center;margin:1.5rem auto;\">\n  <a href=\"https://webmaster.plus\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display:inline-block;\">\n    <img src=\"https://news.pan21.com/webmaster-plus-badge.gif\" alt=\"This website is powered by Webmaster.PLUS\" width=\"320\" height=\"80\" style=\"max-width:100%;height:auto;display:block;margin:0 auto;\">\n  </a>\n</div>"}} />
        {/* <!-- WEBMASTER_PLUS_BADGE:END --> */}
        <Footer locale={locale} />
      </body>
    </html>
  );
}
