import Link from 'next/link';

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
