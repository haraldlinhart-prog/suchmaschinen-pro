import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('home', 'en', {
  title: 'search-engines.pro — SEO content that actually gets indexed',
  absoluteTitle: true,
  description: 'Automatically generated, topically relevant articles — published directly on your own domain and shared on your Facebook page. Real visibility, not empty impressions.',
});

export default function EnglishHomePage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: `linear-gradient(90deg, rgba(6,20,15,0.85) 0%, rgba(6,20,15,0.3) 30%, rgba(6,20,15,0.3) 62%, rgba(6,20,15,0.85) 100%), url('/hero-graphic-en.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          padding: '5rem 1.5rem 4.5rem',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label" style={{ color: 'var(--emerald-light)' }}>AI-written SEO content that lives on your own domain</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', margin: '1rem 0 1.25rem', letterSpacing: '-0.02em' }}>
            Articles Google actually indexes — because they live on your own domain.
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', margin: '0 auto 2.2rem', lineHeight: 1.65, maxWidth: 600 }}>
            We analyze your website, find the search terms your customers use, and write matching articles — published directly
            under <code style={{ background: 'rgba(255,255,255,0.12)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>yourdomain.com/blog/</code> and
            shared on your Facebook business page at the same time.
          </p>
          <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>
              Try it for free →
            </Link>
            <a href="#comparison" className="btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem', borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>
              What&apos;s the difference?
            </a>
          </div>
        </div>
      </section>

      {/* Problem / Differentiator */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="section-label">The difference</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>
            One domain that grows — not a dozen small islands
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: 640, margin: '1rem auto 0', lineHeight: 1.65 }}>
            There&apos;s no shortage of providers doing automated SEO content. What actually matters is <strong>where</strong> the articles end up: with us, every article appears on your own domain — not on a subdomain, and not in a third-party system bolted on afterwards. Every published article adds directly to your main domain&apos;s visibility and Google impressions instead of spreading them across a separate system.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>🏝️</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Subdomains isolate authority</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Articles on <code>news.yourdomain.com</code> start close to zero, SEO-wise — your main domain&apos;s authority barely carries over.
            </p>
          </div>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>🔌</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Footer plugins fall flat</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Content injected via JavaScript after the page has loaded is often not reliably picked up by Google, or is dismissed as generic.
            </p>
          </div>
          <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--emerald)', borderWidth: 2 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>✅</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Our approach: one domain, growing together</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Every article lives on the same domain as the rest of your website and is linked from an article overview page. Each new article increases the number of pages your domain shows up with in Google Search — the impressions grow on your own domain, not on a bolted-on third-party system.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '4rem 1.5rem', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-label">This is how simple it is</div>
            <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>How it works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1.25rem' }}>
            {[
              { n: '01', t: 'Add your website', d: 'Enter your domain — we automatically analyze its content, offer, and audience.' },
              { n: '02', t: 'Find keywords', d: 'We identify relevant search terms with real search volume.' },
              { n: '03', t: 'Write articles', d: 'An AI-written article is created for each search term, matched to your topic.' },
              { n: '04', t: 'Publish natively', d: 'Directly under /blog/ on your domain — or as regular posts in your WordPress.' },
              { n: '05', t: 'Share on Facebook', d: 'Each new article is posted to your Facebook business page at the same time.' },
            ].map(s => (
              <div key={s.n} className="card" style={{ padding: '1.5rem', ...(s.n === '05' ? { borderColor: '#1877F2', borderWidth: 2 } : {}) }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: s.n === '05' ? '#1877F2' : 'var(--emerald)', fontSize: '0.85rem', marginBottom: '0.6rem' }}>{s.n}</div>
                <h3 style={{ fontSize: '0.98rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>{s.t}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.d}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '2.5rem', fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65, textAlign: 'center' }}>
            Search terms become articles. Articles become new chances to be found —
            on Google <em>and</em> on Facebook.
          </p>
        </div>
      </section>

      {/* Facebook highlight */}
      <section style={{ padding: '3.5rem 1.5rem', maxWidth: 860, margin: '0 auto' }}>
        <div className="card" style={{ padding: '2.25rem 2.5rem', borderLeft: '4px solid #1877F2', background: 'linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>👍</div>
            <div style={{ flex: '1 1 260px' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.6rem' }}>
                Facebook: your articles reach people who aren&apos;t searching yet
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                Every new article is automatically shared on your Facebook business page. That puts your content in the feeds of
                people who don&apos;t know you yet — with no extra work and no extra budget. SEO brings you visitors who are actively
                searching; Facebook brings you readers who discover you by chance. Two channels, one step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section id="comparison" style={{ padding: '4rem 1.5rem', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-label">The comparison</div>
            <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>
              Google Ads vs. search-engines.pro
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'left', background: 'var(--ink)', color: 'white', fontWeight: 600, width: '34%' }}>Criterion</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'center', background: '#EA4335', color: 'white', fontWeight: 600, width: '33%' }}>Google Ads</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'center', background: 'var(--emerald)', color: 'white', fontWeight: 600, width: '33%' }}>search-engines.pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Cost per visitor', 'You pay for every click', 'Fixed monthly price'],
                  ['Effect after you stop', 'Traffic stops immediately', 'Articles stay online'],
                  ['Building visibility', 'None — it’s only rented', 'Grows with every article'],
                  ['Facebook reach', 'Separate campaign needed', 'Included automatically'],
                  ['Effort', 'Ongoing optimization', 'Set it up once, it runs'],
                  ['Entry cost', 'From approx. €300–500/month', 'From €0 (FREE plan)'],
                ].map(([k, ads, sp], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '0.9rem 1.25rem', color: 'var(--ink)', fontWeight: 500 }}>{k}</td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center', color: '#991b1b' }}>{ads}</td>
                    <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center', color: '#166534', fontWeight: 600 }}>{sp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SEO hydra */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="section-label">Everything in one place</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>Stop feeding the SEO hydra</h2>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '2rem', lineHeight: 1.75, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seo-hydra.webp" srcSet="/seo-hydra-768.webp 768w, /seo-hydra.webp 1536w" sizes="(max-width: 960px) 100vw, 960px"
            width={1536} height={1024} loading="lazy" alt="A many-headed hydra of tangled cables, each head carrying a price tag for another SEO tool"
            style={{ display: 'block', width: '100%', height: 'auto' }} />
          <div style={{ padding: '2rem 2.25rem' }}>
          <p style={{ margin: '0 0 1rem' }}>
            Working with search engines and SEO is like fighting a hydra: the more you do and the more apparent success you have, the more providers
            want even more money for yet another add-on. In the end you are tied to a pile of “useful” services that together cost as much as the
            lease on a sports car – and still don&apos;t really deliver.
          </p>
          <p style={{ margin: 0 }}>
            With <strong>search-engines.pro</strong> you don&apos;t just get a strong service for less than elsewhere – you get everything you need:
            you see where your website stands on Google, and you can watch it typically gain more and more impressions within a few weeks thanks to our AI services.
          </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="section-label">Pricing</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>Regular articles for your website and Facebook</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
            A new article every two weeks on the free plan.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', maxWidth: 960, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>FREE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>€0</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 article every 2 weeks. Free as long as our badge is embedded on your website.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Start for free</Link>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>BASIC</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              €19<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}> / month</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 article per week. No badge required.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Get started</Link>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>PRO</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              €29<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}> / month</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 article every 2 days, with internal links to your previous articles.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Get started</Link>
          </div>
        </div>

        <div
          style={{
            maxWidth: 960,
            margin: '1.25rem auto 0',
            padding: '2.25rem 2rem',
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--ink) 0%, #0d2e22 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div style={{ textAlign: 'left', flex: '1 1 320px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--emerald-light)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.4rem' }}>PREMIUM · MAXIMUM IMPACT</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: 'white' }}>€49</span>
              <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)' }}>/ month</span>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              1 article every day, with internal links – plus: new articles are also linked from relevant existing articles,
              and articles that lose positions on Google or get stuck on pages 2 to 4 are automatically revised.*
            </p>
          </div>
          <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '0.9rem 2.2rem', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
            Get started
          </Link>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          All prices exclude VAT. Cancel monthly, no minimum term.
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.4rem auto 0', maxWidth: 720 }}>
          * Adding links to and revising articles that have already been published is currently not available for WordPress websites.
          Revisions are based on ranking data from Google Search Console (connection coming soon for all customers).
        </p>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '4rem 1.5rem', textAlign: 'center', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: 'var(--ink)', fontWeight: 600, lineHeight: 1.5, marginBottom: '2rem' }}>
            The search terms are already out there.<br />Let them turn into articles.
          </p>
          <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
            Start for free →
          </Link>
        </div>
      </section>
    </>
  );
}
