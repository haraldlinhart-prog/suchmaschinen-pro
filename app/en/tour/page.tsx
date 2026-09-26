import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tour: What you get with search-engines.pro',
  description:
    'Step by step with real screenshots: registration, website analysis, keyword volumes and Google Ads cost, keyword check, ranking overview, and articles published on your own domain.',
  alternates: { canonical: 'https://www.search-engines.pro/en/tour' },
};

type Step = {
  n: string;
  title: string;
  text: string[];
  img: string;
  w: number;
  h: number;
  alt: string;
  narrow?: boolean;
  badge?: string;
};

const SC_BADGE = 'Requires Google Search Console · coming soon for all customers';

const steps: Step[] = [
  {
    n: '01',
    title: 'Register for free',
    text: [
      'All you need is an email address and a password. No minimum term, cancel monthly.',
      'You land straight in your dashboard and can add your first website right away.',
    ],
    img: '/tour/01-registrierung.webp', w: 465, h: 660, narrow: true,
    alt: 'Registration form on search-engines.pro with email address and password fields',
  },
  {
    n: '02',
    title: 'Add your website',
    text: [
      'Enter your domain and tell us where your site runs: WordPress, Vercel, Netlify, a classic web host, or "I\'m not sure".',
      'For WordPress, an application password from your WordPress profile is all that\'s needed — no plugin, no redirect rules. Articles appear as regular posts.',
    ],
    img: '/tour/02-website-anlegen.webp', w: 515, h: 725, narrow: true,
    alt: 'Form for adding a website with domain, platform selector (WordPress), and application password field',
  },
  {
    n: '03',
    title: 'Automatic analysis and plan',
    text: [
      'We read your website and identify your offer, target audience, and topics. From this we build your content plan.',
      'Your plan sets how often a new article is published — from every two weeks to daily. Publishing can be paused at any time with a single click.',
    ],
    img: '/tour/03-uebersicht-tarif.webp', w: 1200, h: 634,
    alt: 'Website overview showing plan selection (Free, Basic, Pro, Premium) and auto-publish status',
  },
  {
    n: '04',
    title: 'Suggested keywords — with real numbers',
    text: [
      'From the analysis, the AI derives dozens of relevant search terms, each with its search intent (informational, commercial, transactional).',
      'For every keyword you see the monthly search volume in your country and the Google Ads price — what advertisers pay for a single click. Keywords nobody searches for are automatically skipped when publishing.',
      'Use "Publish next" to decide which article gets written first.',
    ],
    img: '/tour/04-vorschlaege.webp', w: 1160, h: 595,
    alt: 'List of suggested keywords with search volume, Google Ads price, and generate buttons',
  },
  {
    n: '05',
    title: 'Check a keyword before the article is written',
    text: [
      'Know what your customers are searching for? Enter the term. Before any article is written you see:',
      '• how many people search for it each month,\n• how many visitors a page ranking at position 1, 3, 10, or 20 would approximately bring,\n• what those same visitors would cost via Google Ads.',
      'You also get a clear verdict on whether the keyword is worth pursuing, and better alternatives if not. Only then do you create the article or queue it for later.',
    ],
    img: '/tour/05-suchbegriff-pruefen.webp', w: 1160, h: 897,
    alt: 'Keyword check for "GmbH Liquidation" showing search volume, recommendation, and a table of estimated visitors per Google position with equivalent Google Ads cost',
  },
  {
    n: '06',
    title: 'Your keywords in Google',
    text: [
      'Which search terms already bring your website into Google results? The list shows them with search volume, impressions, clicks, and average position.',
      'Where no article exists yet, you can create one with a single click — and where Google already sees you, the path to the top is shortest.',
    ],
    img: '/tour/06-google-suchbegriffe.webp', w: 1160, h: 750, badge: SC_BADGE,
    alt: 'Keywords from Google Search Console with search volume, position, and buttons to queue or create an article',
  },
  {
    n: '07',
    title: 'Ranking overview at a glance',
    text: [
      'How many keywords rank, how many of them on page 1, and how your average position has developed over 90 days.',
      'For each individual page, a dot per keyword shows where it sits in Google — the further left, the better. Watch your website gain visibility week by week.',
    ],
    img: '/tour/07-ranking.webp', w: 1160, h: 1159, badge: SC_BADGE,
    alt: 'Ranking overview with key metrics, position distribution, position trend chart, and keywords per page',
  },
  {
    n: '08',
    title: 'All articles at a glance',
    text: [
      'Every published article with keyword, URL, and preview. With a Search Console connection you also see whether Google has indexed the article, how often it has been shown and clicked, and at what position it ranks.',
    ],
    img: '/tour/08-artikel.webp', w: 1160, h: 620,
    alt: 'List of published articles with status, keyword, and URL',
  },
  {
    n: '09',
    title: 'Live on your own domain',
    text: [
      'Articles appear under yourdomain.com/blog/ or as posts in your WordPress — not on a foreign subdomain. With a featured image and clean heading structure.',
      'New articles are automatically added to your website\'s sitemap, which Google reads regularly.',
    ],
    img: '/tour/09-artikel-live.webp', w: 1000, h: 1149, narrow: true,
    alt: 'Published article on firmenabwicklung.de with headline and featured image',
  },
  {
    n: '10',
    title: 'Discoverable by visitors and Google',
    text: [
      'An article nobody links to won\'t be found. For directly connected websites we therefore create an overview page listing all articles, link it from your homepage ("Articles"), and register the article sitemap in robots.txt. Under each article, "More articles" leads back to the overview.',
      'For WordPress, your existing blog with its sitemap handles this automatically.',
    ],
    img: '/tour/10-ratgeber-seite.webp', w: 1000, h: 1132, narrow: true,
    alt: 'Article overview page on firmenabwicklung.de',
  },
];

const plans = ['Free', 'Basic', 'Pro', 'Premium'];
const features: { label: string; on: boolean[] | string[] }[] = [
  { label: 'New article', on: ['every 2 weeks', '1× per week', 'every 2 days', 'daily'] },
  { label: 'Website analysis and content plan', on: [true, true, true, true] },
  { label: 'Search volume and Google Ads cost per keyword', on: [true, true, true, true] },
  { label: 'Check your own keywords', on: [true, true, true, true] },
  { label: 'Published on your domain, sitemap, articles link', on: [true, true, true, true] },
  { label: 'New articles link to relevant older articles', on: [false, false, true, true] },
  { label: 'Older articles link back to new articles', on: [false, false, false, true] },
  { label: 'Articles that slip in Google are automatically refreshed', on: [false, false, false, true] },
  { label: 'No search-engines.pro badge on your website', on: [false, true, true, true] },
];

const h2 = { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 2.4vw, 1.5rem)', color: 'var(--ink)', margin: '0.35rem 0 0.8rem' } as const;
const p = { color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 0.7rem', whiteSpace: 'pre-line' } as const;

function Shot({ s }: { s: Step }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border, #e3e8e6)', boxShadow: '0 12px 40px rgba(10,40,30,0.10)', background: '#f7f9f8' }}>
      <div style={{ display: 'flex', gap: 6, padding: '9px 12px', background: '#eef2f0', borderBottom: '1px solid #e3e8e6' }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: '#d5dcd9' }} />
        <span style={{ width: 10, height: 10, borderRadius: 5, background: '#d5dcd9' }} />
        <span style={{ width: 10, height: 10, borderRadius: 5, background: '#d5dcd9' }} />
      </div>
      <a href={s.img} target="_blank" rel="noopener" title="Open screenshot at full size">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.img} width={s.w} height={s.h} alt={s.alt} loading={s.n === '01' ? 'eager' : 'lazy'}
          style={{ display: 'block', width: '100%', height: 'auto' }} />
      </a>
    </div>
  );
}

export default function TourPage() {
  return (
    <>
      <section style={{ padding: '4rem 1.5rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="section-label">Tour</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 3.6vw, 2.4rem)', color: 'var(--ink)', margin: '0 0 1rem' }}>
            What you get with search-engines.pro
          </h1>
          <p style={{ ...p, fontSize: '1.02rem' }}>
            No promises on a slide deck — the real system, step by step, with screenshots from a live account.
            From registration to an article live on your own domain.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>
        {steps.map((s, i) => (
          <section key={s.n} id={`step-${s.n}`}
            style={{
              display: 'grid',
              gridTemplateColumns: s.narrow ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
              gap: s.narrow ? '2.5rem' : '1.5rem',
              alignItems: 'center',
            }}>
            <div style={{ order: s.narrow && i % 2 === 1 ? 2 : 1, maxWidth: s.narrow ? 480 : 760, margin: s.narrow ? undefined : '0 auto', textAlign: s.narrow ? 'left' : 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--emerald)', fontSize: '0.9rem' }}>Step {s.n}</div>
              <h2 style={h2}>{s.title}</h2>
              {s.badge && (
                <div style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', background: 'rgba(15,122,92,0.09)', borderRadius: 999, padding: '0.25rem 0.75rem', marginBottom: '0.8rem' }}>
                  {s.badge}
                </div>
              )}
              {s.text.map((t, k) => <p key={k} style={{ ...p, textAlign: s.narrow || t.startsWith('•') ? 'left' : 'center', display: t.startsWith('•') ? 'inline-block' : 'block' }}>{t}</p>)}
            </div>
            <div style={{ order: s.narrow && i % 2 === 1 ? 1 : 2, maxWidth: s.narrow ? 460 : 960, width: '100%', margin: '0 auto' }}>
              <Shot s={s} />
            </div>
          </section>
        ))}
      </div>

      <section style={{ padding: '4rem 1.5rem', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="section-label">What&apos;s included per plan</div>
            <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
            <h2 style={{ ...h2, fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>Everything included — no add-on subscriptions</h2>
          </div>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 620 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem 1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Feature</th>
                  {plans.map(pl => (
                    <th key={pl} style={{ padding: '1rem 0.6rem', color: pl === 'Premium' ? 'var(--emerald)' : 'var(--ink)', fontWeight: 700, textAlign: 'center' }}>{pl}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map(f => (
                  <tr key={f.label} style={{ borderTop: '1px solid #e8edeb' }}>
                    <td style={{ padding: '0.8rem 1.1rem', color: 'var(--ink)' }}>{f.label}</td>
                    {f.on.map((v, k) => (
                      <td key={k} style={{ padding: '0.8rem 0.6rem', textAlign: 'center', color: v ? 'var(--emerald)' : '#b7c2be', fontWeight: typeof v === 'string' ? 600 : 700 }}>
                        {typeof v === 'string' ? <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{v}</span> : v ? '✓' : '–'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...p, fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
            Ranking overview, your Google keywords, and the indexing status per article require a Google Search Console connection and will be available to all customers soon.
          </p>
          <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>Try it for free →</Link>
            <Link href="/en#pricing" className="btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>View pricing</Link>
          </div>
        </div>
      </section>
    </>
  );
}
