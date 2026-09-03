import Link from 'next/link';

export default function EnglishHomePage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: `linear-gradient(90deg, rgba(6,20,15,0.85) 0%, rgba(6,20,15,0.3) 30%, rgba(6,20,15,0.3) 62%, rgba(6,20,15,0.85) 100%), url('/hero-graphic.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          padding: '5rem 1.5rem 4.5rem',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ maxWidth: 620, margin: '0 22%', textAlign: 'center' }} className="hero-text-block">
            <div className="section-label" style={{ color: 'var(--emerald-light)' }}>AI-generated SEO content that actually ranks</div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', margin: '1rem 0 1.25rem', letterSpacing: '-0.02em' }}>
              Articles Google actually indexes — because they live on your own domain.
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', margin: '0 auto 2.2rem', lineHeight: 1.65 }}>
              We analyze your website, find the most relevant search terms, and write matching articles — published directly under <code style={{ background: 'rgba(255,255,255,0.12)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>yourdomain.com/blog/</code>, instead of an isolated subdomain or a footer plugin.
            </p>
            <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>
                Try it for free →
              </Link>
              <Link href="/en#how-it-works" className="btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem', borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>
                How it works
              </Link>
            </div>
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
            There&apos;s no shortage of providers doing automated SEO content. What actually matters is <strong>where</strong> the articles end up: with us, every article appears on your own domain — not on a subdomain, and not as a third-party system bolted on afterward. Every published article directly adds to your main domain&apos;s visibility and Google impressions, instead of spreading them across a separate system.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>🏝️</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Subdomains isolate authority</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Articles on <code>news.yourdomain.com</code> start from close to zero, SEO-wise — your main domain&apos;s authority barely carries over.
            </p>
          </div>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>🔌</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Footer plugins feel thin</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Content injected via JavaScript after the fact is often not reliably picked up by Google at all, or gets flagged as generic.
            </p>
          </div>
          <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--emerald)', borderWidth: 2 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>✅</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Our approach: one domain, growing together</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Every article lives in the same directory as the rest of your website, cleanly linked internally. Each new article increases the number of pages your domain shows up with in Google Search — the impressions grow on your own domain, not on a bolted-on third-party system.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '4rem 1.5rem', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-label">Process</div>
            <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>How it works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { n: '01', t: 'Register your website', d: 'Add your domain — we automatically analyze content and structure.' },
              { n: '02', t: 'Find keywords', d: 'We identify relevant search terms with real traffic potential.' },
              { n: '03', t: 'Generate articles', d: 'High-quality articles matched to each topic cluster get written.' },
              { n: '04', t: 'Publish natively', d: 'Directly under /blog/ on your domain, linked internally.' },
              { n: '05', t: 'Track indexing', d: 'Transparent reporting: how many articles Google has actually indexed.' },
            ].map(s => (
              <div key={s.n} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--emerald)', fontSize: '0.85rem', marginBottom: '0.6rem' }}>{s.n}</div>
                <h3 style={{ fontSize: '0.98rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>{s.t}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="section-label">Pricing</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>Get started</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
            Register your website once, pick a plan — articles run automatically after that.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', maxWidth: 960, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>FREE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>€0</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 article every 2 weeks. Free, as long as our badge is embedded on your website.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Start for free</Link>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--emerald)', borderWidth: 1.5 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--emerald)', fontWeight: 600, marginBottom: '0.5rem' }}>BASIC</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              €19<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}> / month</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 article per week. No badge required.
            </p>
            <Link href="/auth?mode=register" className="btn-emerald" style={{ width: '100%', justifyContent: 'center' }}>Get started</Link>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>PRO</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              €29<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}> / month</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 article every day. Maximum publishing speed.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Get started</Link>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          All prices plus applicable tax. Cancel monthly, no minimum term.
        </p>
      </section>
    </>
  );
}
