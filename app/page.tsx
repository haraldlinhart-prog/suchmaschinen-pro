import Link from 'next/link';

export default function HomePage() {
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
            <div className="section-label" style={{ color: 'var(--emerald-light)' }}>KI-generierter SEO-Content, der tatsächlich rankt</div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', margin: '1rem 0 1.25rem', letterSpacing: '-0.02em' }}>
              Artikel, die Google tatsächlich indexiert — weil sie auf Ihrer eigenen Domain liegen.
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', margin: '0 auto 2.2rem', lineHeight: 1.65 }}>
              Wir analysieren Ihre Website, finden die relevantesten Suchbegriffe und schreiben passende Artikel — veröffentlicht direkt unter <code style={{ background: 'rgba(255,255,255,0.12)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>ihredomain.de/blog/</code>, statt auf einer isolierten Subdomain oder als Footer-Plugin.
            </p>
            <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>
                Kostenlos testen →
              </Link>
              <Link href="#so-funktionierts" className="btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem', borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>
                So funktioniert&apos;s
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Differentiator */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="section-label">Der Unterschied</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>
            Warum die meisten SEO-Auto-Publishing-Tools nicht wirken
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>🏝️</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Subdomains isolieren</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Artikel auf <code>news.ihredomain.de</code> starten SEO-technisch praktisch bei null — die Autorität Ihrer Hauptdomain überträgt sich kaum.
            </p>
          </div>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>🔌</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Footer-Plugins wirken dünn</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Per JavaScript nachträglich eingefügter Content wird von Google oft gar nicht zuverlässig erfasst oder als generisch eingestuft.
            </p>
          </div>
          <div className="card" style={{ padding: '1.75rem', borderColor: 'var(--emerald)', borderWidth: 2 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>✅</div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Unser Ansatz: native Integration</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Artikel liegen direkt im Verzeichnis Ihrer Hauptdomain, sauber verlinkt — echter Teil Ihrer Seite statt angeflanschtem Fremdsystem.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="so-funktionierts" style={{ padding: '4rem 1.5rem', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-label">Ablauf</div>
            <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>So funktioniert&apos;s</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { n: '01', t: 'Website registrieren', d: 'Domain hinzufügen — wir analysieren Inhalt und Struktur automatisch.' },
              { n: '02', t: 'Keywords finden', d: 'Relevante Suchbegriffe mit echtem Traffic-Potenzial werden identifiziert.' },
              { n: '03', t: 'Artikel generieren', d: 'Passende, hochwertige Artikel werden pro Themencluster geschrieben.' },
              { n: '04', t: 'Nativ veröffentlichen', d: 'Direkt unter /blog/ auf Ihrer Domain, intern verlinkt.' },
              { n: '05', t: 'Indexierung tracken', d: 'Transparentes Reporting: wie viele Artikel Google tatsächlich indexiert hat.' },
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
      <section id="preise" style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="section-label">Preise</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>Einfach starten</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
            Einmalig Website registrieren, Tarif wählen — Artikel laufen automatisch.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', maxWidth: 960, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>FREE</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>0 €</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 Artikel alle 2 Wochen. Kostenlos, solange unser Badge auf Ihrer Website eingebunden ist.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Kostenlos starten</Link>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', borderColor: 'var(--emerald)', borderWidth: 1.5 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--emerald)', fontWeight: 600, marginBottom: '0.5rem' }}>BASIC</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              19 €<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}> / Monat</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 Artikel pro Woche. Kein Badge nötig.
            </p>
            <Link href="/auth?mode=register" className="btn-emerald" style={{ width: '100%', justifyContent: 'center' }}>Jetzt starten</Link>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>PRO</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              29 €<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}> / Monat</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 Artikel täglich. Maximales Publishing-Tempo.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Jetzt starten</Link>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Alle Preise zzgl. USt. Monatlich kündbar, keine Mindestlaufzeit.
        </p>
      </section>
    </>
  );
}
