import Link from 'next/link';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('home', 'de', {
  title: 'suchmaschinen.pro — SEO-Content, der wirklich indexiert wird',
  absoluteTitle: true,
  description: 'Automatisch generierte, thematisch passende Artikel — direkt auf Ihrer eigenen Domain veröffentlicht und auf Ihrer Facebook-Seite geteilt. Für echte Sichtbarkeit statt leerer Impressionen.',
});

export default function HomePage() {
  return (
    <>
{/* <!-- BEEHIIV:START --> */}
<div dangerouslySetInnerHTML={{__html: "\n<!-- BEEHIIV WIDGET: eigenes Design, kein Iframe, API-basiert -->\n<div id=\"pan21-nl-wrap\" style=\"position:fixed;bottom:100px;right:24px;z-index:9999;font-family:system-ui,sans-serif;\">\n  <button id=\"pan21-nl-btn\" onclick=\"(function(){var w=document.getElementById('pan21-nl-card');var open=w.style.display==='block';w.style.display=open?'none':'block';document.getElementById('pan21-nl-btn').innerHTML=open?'<svg width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 20 20\\' fill=\\'currentColor\\' style=\\'vertical-align:middle;margin-right:7px;\\'><path d=\\'M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z\\'/><path d=\\'M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z\\'/></svg>Newsletter':'&#10005; Schlie&szlig;en';})()\" style=\"background:#0B1F3A;color:#C9963A;border:1.5px solid rgba(196,150,58,0.45);padding:10px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;display:flex;align-items:center;gap:7px;box-shadow:0 3px 14px rgba(0,0,0,0.28);letter-spacing:0.04em;\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 20 20\" fill=\"currentColor\"><path d=\"M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z\"/><path d=\"M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z\"/></svg>Newsletter</button>\n  <div id=\"pan21-nl-card\" style=\"display:none;margin-top:8px;width:320px;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(11,31,58,0.22);border:1px solid #E2DDD8;overflow:hidden;\">\n    <div style=\"background:#0B1F3A;padding:16px 20px;\">\n      <div style=\"font-family:Georgia,serif;font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:2px;\">PAN21 Newsletter</div>\n      <div style=\"font-size:0.72rem;color:rgba(255,255,255,0.55);letter-spacing:0.08em;text-transform:uppercase;\">Neuigkeiten &amp; Updates</div>\n    </div>\n    <div style=\"padding:20px;\">\n      <p style=\"font-size:0.84rem;color:#5E7085;line-height:1.55;margin-bottom:16px;\">Aktuelle Informationen aus dem PAN21-Netzwerk. Kein Spam, jederzeit abbestellbar.</p>\n      <div id=\"pan21-nl-form\">\n        <input id=\"pan21-nl-email\" type=\"email\" placeholder=\"Ihre E-Mail-Adresse\" style=\"width:100%;padding:10px 12px;border:1.5px solid #DDE3EC;border-radius:5px;font-size:0.875rem;font-family:system-ui,sans-serif;color:#1A2530;outline:none;margin-bottom:10px;box-sizing:border-box;\" onfocus=\"this.style.borderColor='#0B1F3A'\" onblur=\"this.style.borderColor='#DDE3EC'\">\n        <button onclick=\"pan21NlSubmit()\" style=\"width:100%;background:#C4963A;color:#fff;border:none;padding:11px;border-radius:5px;font-weight:700;font-size:0.875rem;cursor:pointer;letter-spacing:0.04em;\">Jetzt anmelden</button>\n      </div>\n      <div id=\"pan21-nl-ok\" style=\"display:none;text-align:center;padding:12px 0;\">\n        <div style=\"font-size:1.5rem;margin-bottom:6px;\">✓</div>\n        <div style=\"font-weight:700;color:#0B1F3A;font-size:0.9rem;\">Angemeldet!</div>\n        <div style=\"font-size:0.78rem;color:#5E7085;margin-top:4px;\">Bitte bestätigen Sie Ihre E-Mail.</div>\n      </div>\n      <div id=\"pan21-nl-err\" style=\"display:none;background:#FEF2F2;border-radius:4px;padding:8px 12px;font-size:0.78rem;color:#991B1B;margin-top:8px;\"></div>\n    </div>\n  </div>\n</div>\n\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){if(document.getElementById('pan21si44i52k'))return;var m=document.createElement('meta');m.id='pan21si44i52k';document.head.appendChild(m);(function(){var s=document.createElement('script');s.textContent=&quot;\\nasync function pan21NlSubmit(){\\n  var email=document.getElementById('pan21-nl-email').value.trim();\\n  if(!email||!email.includes('@')){\\n    var err=document.getElementById('pan21-nl-err');\\n    err.textContent='Bitte geben Sie eine gültige E-Mail-Adresse ein.';\\n    err.style.display='block';return;\\n  }\\n  document.getElementById('pan21-nl-err').style.display='none';\\n  var btn=event.target||document.querySelector('#pan21-nl-form button');\\n  btn.textContent='Wird gesendet…';btn.disabled=true;\\n  try{\\n    var res=await fetch('https://news.pan21.com/api/beehiiv-subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})});\\n    if(res.ok){\\n      document.getElementById('pan21-nl-form').style.display='none';\\n      document.getElementById('pan21-nl-ok').style.display='block';\\n    }else{\\n      var d=await res.json();\\n      document.getElementById('pan21-nl-err').textContent=d.error||'Fehler. Bitte versuchen Sie es später.';\\n      document.getElementById('pan21-nl-err').style.display='block';\\n      btn.textContent='Jetzt anmelden';btn.disabled=false;\\n    }\\n  }catch(e){\\n    document.getElementById('pan21-nl-err').textContent='Netzwerkfehler. Bitte versuchen Sie es später.';\\n    document.getElementById('pan21-nl-err').style.display='block';\\n    btn.textContent='Jetzt anmelden';btn.disabled=false;\\n  }\\n}\\n&quot;;document.head.appendChild(s);})();})();\">"}} />
{/* <!-- BEEHIIV:END --> */}
      {/* Hero */}
      <section
        style={{
          background: `linear-gradient(90deg, rgba(6,20,15,0.85) 0%, rgba(6,20,15,0.3) 30%, rgba(6,20,15,0.3) 62%, rgba(6,20,15,0.85) 100%), url('/hero-graphic.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          padding: '5.5rem 1.5rem 5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="section-label" style={{ color: 'var(--emerald-light)', marginBottom: '1rem' }}>
            Statt jeden Klick zu bezahlen
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', margin: '0 0 1.25rem', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Bauen Sie sich eine weitere Besucherquelle auf.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', margin: '0 auto 2.5rem', lineHeight: 1.65, maxWidth: 580 }}>
            suchmaschinen.pro analysiert Ihre Website und findet die Suchbegriffe, nach denen Ihre Kunden suchen.
            Daraus entstehen regelmäßig Artikel — automatisch veröffentlicht auf Ihrer Website
            und gleichzeitig auf Ihrer Facebook-Unternehmensseite geteilt.
          </p>
          <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>
              Kostenlos testen →
            </Link>
            <Link href="#vergleich" className="btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem', borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>
              Was ist der Unterschied?
            </Link>
          </div>
        </div>
      </section>

      {/* Visual Flow */}
      <section style={{ padding: '4.5rem 1.5rem', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <div className="section-label">So einfach funktioniert&apos;s</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto 2.5rem' }} />

          {/* Flow diagram */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', rowGap: '1.5rem' }}>

            {/* Step 1: Suchbegriff */}
            <div style={{ textAlign: 'center', minWidth: 150 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--ink)', border: '2px solid var(--emerald)', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                🔍
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>Suchbegriff</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>aus der Analyse<br />Ihrer Website</div>
            </div>

            {/* Arrow */}
            <div style={{ color: 'var(--emerald)', fontSize: '1.5rem', padding: '0 0.5rem', fontWeight: 700 }}>→</div>

            {/* Step 2: Artikel */}
            <div style={{ textAlign: 'center', minWidth: 150 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--emerald)', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                ✍️
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>KI-Artikel</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>wird automatisch<br />geschrieben</div>
            </div>

            {/* Arrow */}
            <div style={{ color: 'var(--emerald)', fontSize: '1.5rem', padding: '0 0.5rem', fontWeight: 700 }}>→</div>

            {/* Step 3: Split destinations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', border: '2px solid var(--emerald)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🌐</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--ink)' }}>Ihre Website</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ihredomain.de/blog/</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#1877F2', borderRadius: 10, padding: '0.75rem 1rem' }}>
                <span style={{ fontSize: '1.4rem' }}>👍</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'white' }}>Facebook-Seite</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>gleichzeitig geteilt</div>
                </div>
              </div>
            </div>
          </div>

          <p style={{ marginTop: '2.5rem', fontSize: '1rem', color: 'var(--text-muted)', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
            Aus Suchbegriffen werden Artikel. Aus Artikeln neue Chancen, gefunden zu werden —
            auf Google <em>und</em> auf Facebook.
          </p>
        </div>
      </section>

      {/* Facebook highlight */}
      <section style={{ padding: '3.5rem 1.5rem', maxWidth: 860, margin: '0 auto' }}>
        <div className="card" style={{ padding: '2.25rem 2.5rem', borderLeft: '4px solid #1877F2', background: 'linear-gradient(135deg, #f0f5ff 0%, #ffffff 100%)' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '2.5rem', flexShrink: 0 }}>👍</div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.6rem' }}>
                Facebook: Ihre Artikel erreichen Menschen, die noch nicht aktiv suchen
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                Jeder neue Artikel wird automatisch auf Ihrer Facebook-Unternehmensseite geteilt.
                Das bedeutet: Ihre Inhalte erscheinen im Feed von Menschen, die Sie noch nicht kennen —
                ohne zusätzlichen Aufwand, ohne extra Budget. SEO bringt Ihnen Besucher, die aktiv suchen.
                Facebook bringt Ihnen Leser, die zufällig auf Sie aufmerksam werden. Zwei Kanäle,
                ein Arbeitsschritt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section id="vergleich" style={{ padding: '4rem 1.5rem', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-label">Der Vergleich</div>
            <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>
              Google Ads vs. suchmaschinen.pro
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem', background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'left', background: 'var(--ink)', color: 'white', fontWeight: 600, width: '34%' }}>Kriterium</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'center', background: '#EA4335', color: 'white', fontWeight: 600, width: '33%' }}>Google Ads</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'center', background: 'var(--emerald)', color: 'white', fontWeight: 600, width: '33%' }}>suchmaschinen.pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Kosten pro Besucher', 'Jeder Klick kostet', 'Fester Monatspreis'],
                  ['Wirkung nach Stopp', 'Sofort kein Traffic mehr', 'Artikel bleiben online'],
                  ['Aufbau von Sichtbarkeit', 'Keine — nur gemietet', 'Wächst mit jedem Artikel'],
                  ['Facebook-Reichweite', 'Separate Kampagne nötig', 'Automatisch inklusive'],
                  ['Aufwand', 'Laufende Optimierung', 'Einmal einrichten, läuft'],
                  ['Einstiegskosten', 'Ab ca. 300–500 €/Monat', 'Ab 0 € (FREE-Plan)'],
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


      {/* SEO-Hydra */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="section-label">Alles aus einer Hand</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>Schluss mit der SEO-Hydra</h2>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '2rem', lineHeight: 1.75, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/seo-hydra.webp" srcSet="/seo-hydra-768.webp 768w, /seo-hydra.webp 1536w" sizes="(max-width: 960px) 100vw, 960px"
            width={1536} height={1024} loading="lazy" alt="Eine vielk&ouml;pfige Hydra aus verknoteten Kabeln, jeder Kopf mit Preisschild f&uuml;r ein weiteres SEO-Tool"
            style={{ display: 'block', width: '100%', height: 'auto' }} />
          <div style={{ padding: '2rem 2.25rem' }}>
          <p style={{ margin: '0 0 1rem' }}>
            Die Arbeit mit Suchmaschinen und SEO ist wie eine Art Hydra: Je mehr man macht und je mehr vermeintliche Erfolge man hat, desto mehr
            Anbieter wollen f&uuml;r zus&auml;tzliche Optionen noch mehr Geld. Am Ende sieht man sich mit einem Haufen &bdquo;n&uuml;tzlicher&ldquo; Services verbunden, die
            zusammen die Leasingrate eines Sportwagens kosten &ndash; aber eigentlich nach wie vor nicht wirklich etwas bringen.
          </p>
          <p style={{ margin: 0 }}>
            Bei <strong>suchmaschinen.pro</strong>{" "}bekommen Sie nicht nur einen starken Service für weniger Geld als anderswo, sondern alles, was Sie brauchen: Sie sehen, wo sich Ihre Website bei Google befindet – und Sie sehen, wie sie mit unseren KI-Services in der Regel nach ein paar Wochen immer mehr Impressionen bekommt.
          </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="section-label">Preise</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: 'var(--ink)' }}>
            Regelmäßige Artikel für Ihre Website und Facebook
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
            Im kostenlosen Tarif alle zwei Wochen ein neuer Artikel.
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
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>BASIC</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              19 €<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}> / Monat</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 Artikel pro Woche. Kein Badge nötig.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Jetzt starten</Link>
          </div>
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>PRO</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>
              29 €<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}> / Monat</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              1 Artikel alle 2 Tage, mit interner Verlinkung zu Ihren bisherigen Artikeln.
            </p>
            <Link href="/auth?mode=register" className="btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Jetzt starten</Link>
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
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--emerald-light)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.4rem' }}>PREMIUM · MAXIMALE WIRKUNG</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: 'white' }}>49 €</span>
              <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)' }}>/ Monat</span>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              1 Artikel täglich, mit interner Verlinkung – plus: Neue Artikel werden zusätzlich in passende bestehende Artikel eingebunden,
              und Artikel, die bei Google an Position verlieren oder auf den Seiten 2 bis 4 hängen bleiben, werden automatisch überarbeitet.*
            </p>
          </div>
          <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '0.9rem 2.2rem', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
            Jetzt starten
          </Link>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Alle Preise zzgl. USt. Monatlich kündbar, keine Mindestlaufzeit.
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.4rem auto 0', maxWidth: 720 }}>
          * Das nachträgliche Verlinken und Überarbeiten bereits veröffentlichter Artikel ist bei WordPress-Websites derzeit nicht möglich.
          Die Überarbeitung nutzt Positionsdaten aus der Google Search Console (Anbindung in Kürze für alle Kunden).
        </p>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '4rem 1.5rem', textAlign: 'center', background: 'var(--paper-dark)' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', color: 'var(--ink)', fontWeight: 600, lineHeight: 1.5, marginBottom: '2rem' }}>
            Die Suchbegriffe sind schon da.<br />Lassen Sie daraus Artikel entstehen.
          </p>
          <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
            Kostenlos starten →
          </Link>
        </div>
      </section>
    {/* <!-- REVIVE:START --> */}
<div dangerouslySetInnerHTML={{__html: "<div style=\"display:flex;justify-content:center;margin:16px 0;\">\n<ins data-revive-zoneid=\"6\" data-revive-id=\"0b01ba1194fdc0e89c6321458dbc5814\"></ins>\n\n</div>\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){if(document.getElementById('pan21sia9n9z7'))return;var m=document.createElement('meta');m.id='pan21sia9n9z7';document.head.appendChild(m);(function(){var s=document.createElement('script');s.src=&quot;//ads.pan21.com/www/delivery/asyncjs.php&quot;;s.async=true;document.head.appendChild(s);})();})();\">"}} />
{/* <!-- REVIVE:END --> */}
{/* <!-- DIRECTORIES:START --> */}
<div style={{display:'flex',justifyContent:'center',gap:'16px',flexWrap:'wrap',margin:'16px 0'}}>
<a href="https://ffa-links.de" target="_blank" rel="noopener"><img src="https://ffa-links.de/banner.svg" alt="FFA-Links" height={60} style={{borderRadius:'4px'}} /></a>
<a href="https://swiss-quality.de" target="_blank" rel="noopener"><img src="https://swiss-quality.de/banner.svg" alt="Swiss Quality" height={60} style={{borderRadius:'4px'}} /></a>
<a href="https://german-quality.net" target="_blank" rel="noopener"><img src="https://german-quality.net/banner.svg" alt="German Quality" height={60} style={{borderRadius:'4px'}} /></a>
</div>
{/* <!-- DIRECTORIES:END --> */}
{/* <!-- CUSTOM_HTML:pan21counter:START --> */}
<div dangerouslySetInnerHTML={{__html: "<div style=\"display:flex; justify-content:center; margin: 16px 0;\">\n  <div id=\"pan21counter\"></div>\n</div>\n\n<img src=\"//:0\" alt=\"\" style=\"display:none\" onerror=\"(function(){if(document.getElementById('pan21siopzekk'))return;var m=document.createElement('meta');m.id='pan21siopzekk';document.head.appendChild(m);(function(){var s=document.createElement('script');s.src=&quot;https://pan21counter.de/c.js?id=AB861B&quot;;s.async=true;document.head.appendChild(s);})();})();\">"}} />
{/* <!-- CUSTOM_HTML:pan21counter:END --> */}
{/* <!-- CUSTOM_HTML:pagespeed:START --> */}
<div dangerouslySetInnerHTML={{__html: "<div style=\"text-align:center;\">\n  <a href=\"https://pagespeed-plus.de/status.html?key=gfaiox9jor\" target=\"_blank\" rel=\"noopener\">\n    <img src=\"https://pagespeed-plus.de/api/badge?key=gfaiox9jor\" alt=\"PageSpeed Score\" />\n  </a>\n</div>"}} />
{/* <!-- CUSTOM_HTML:pagespeed:END --> */}
{/* <!-- CUSTOM_HTML:linkcheck:START --> */}
<div dangerouslySetInnerHTML={{__html: "<div style=\"text-align:center;\">\n  <a href=\"https://kaputte-links.de/status.html?key=zbp6xwiffk\" target=\"_blank\" rel=\"noopener\"><img src=\"https://kaputte-links.de/api/badge?key=zbp6xwiffk\" alt=\"Link-Status\" width=\"320\" height=\"80\" /></a>\n</div>"}} />
{/* <!-- CUSTOM_HTML:linkcheck:END --> */}
{/* <!-- CUSTOM_HTML:site-ok:START --> */}
<div dangerouslySetInnerHTML={{__html: "<div style=\"text-align:center;\">\n  <a href=\"https://site-ok.de/status.html?key=z8x6ojmwgu\" target=\"_blank\" rel=\"noopener\"><img src=\"https://site-ok.de/api/badge?key=z8x6ojmwgu\" alt=\"Site-Status\" width=\"320\" height=\"80\" /></a>\n</div>"}} />
{/* <!-- CUSTOM_HTML:site-ok:END --> */}
</>
  );
}
