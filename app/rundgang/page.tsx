import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rundgang: Was Sie bei suchmaschinen.pro bekommen',
  description:
    'Schritt für Schritt mit echten Screenshots: Registrierung, Website-Analyse, Suchbegriffe mit Suchvolumen und Google-Ads-Preis, Suchbegriff-Check, Ranking-Übersicht und Artikel auf Ihrer eigenen Domain.',
  alternates: { canonical: 'https://www.suchmaschinen.pro/rundgang' },
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

const SC_BADGE = 'Mit Google Search Console · in Kürze für alle Kunden';

const steps: Step[] = [
  {
    n: '01',
    title: 'Kostenlos registrieren',
    text: [
      'E-Mail-Adresse und Passwort genügen. Keine Mindestlaufzeit, monatlich kündbar.',
      'Direkt danach landen Sie in Ihrem Dashboard und können Ihre erste Website anlegen.',
    ],
    img: '/tour/01-registrierung.webp', w: 465, h: 660, narrow: true,
    alt: 'Registrierungsformular von suchmaschinen.pro mit E-Mail-Adresse und Passwort',
  },
  {
    n: '02',
    title: 'Website anlegen',
    text: [
      'Domain eintragen und angeben, wo die Website läuft: WordPress, Vercel, Netlify, klassischer Webhoster oder „weiß ich nicht“.',
      'Bei WordPress reicht ein Anwendungspasswort aus Ihrem WordPress-Profil – kein Plugin, keine Weiterleitungsregel. Die Artikel erscheinen als ganz normale Beiträge.',
    ],
    img: '/tour/02-website-anlegen.webp', w: 515, h: 725, narrow: true,
    alt: 'Formular zum Anlegen einer Website mit Domain, Plattform WordPress und Anwendungspasswort',
  },
  {
    n: '03',
    title: 'Automatische Analyse und Tarif',
    text: [
      'Wir lesen Ihre Website und erkennen Angebot, Zielgruppe und Themen. Daraus entsteht Ihr Themenplan.',
      'Im Tarif legen Sie fest, wie oft ein neuer Artikel erscheint – von alle zwei Wochen bis täglich. Die Veröffentlichung lässt sich jederzeit mit einem Klick pausieren.',
    ],
    img: '/tour/03-uebersicht-tarif.webp', w: 1200, h: 634,
    alt: 'Website-Übersicht mit Tarifwahl Free, Basic, Pro und Premium und Status der automatischen Veröffentlichung',
  },
  {
    n: '04',
    title: 'Vorgeschlagene Suchbegriffe – mit echten Zahlen',
    text: [
      'Aus der Analyse leitet die KI Dutzende passende Suchbegriffe ab, jeweils mit Suchabsicht (informativ, kommerziell, transaktional).',
      'Zu jedem Begriff sehen Sie das monatliche Suchvolumen in Deutschland und den Google-Ads-Preis: so viel zahlen Werbetreibende für einen einzigen Klick. Begriffe, nach denen niemand sucht, werden bei der automatischen Veröffentlichung übersprungen.',
      'Mit „Als Nächstes“ bestimmen Sie, welcher Artikel zuerst geschrieben wird.',
    ],
    img: '/tour/04-vorschlaege.webp', w: 1160, h: 595,
    alt: 'Liste vorgeschlagener Suchbegriffe mit Suchvolumen, Google-Ads-Preis und Buttons zum Generieren',
  },
  {
    n: '05',
    title: 'Eigenen Suchbegriff prüfen – bevor ein Artikel entsteht',
    text: [
      'Sie wissen selbst, wonach Ihre Kunden suchen? Geben Sie den Begriff ein. Bevor ein Artikel geschrieben wird, sehen Sie:',
      '• wie viele Menschen pro Monat danach suchen,\n• wie viele Besucher ein Artikel auf Platz 1, 3, 10 oder 20 ungefähr bringt,\n• was genau diese Besucher über Google Ads kosten würden.',
      'Dazu eine klare Einschätzung, ob sich der Begriff lohnt, und bessere Alternativen, falls nicht. Erst dann erstellen Sie den Artikel oder merken ihn vor.',
    ],
    img: '/tour/05-suchbegriff-pruefen.webp', w: 1160, h: 897,
    alt: 'Suchbegriff-Check für „GmbH Liquidation“ mit Suchvolumen, Empfehlung und Tabelle Besucher je Google-Platz und Google-Ads-Gegenwert',
  },
  {
    n: '06',
    title: 'Ihre Suchbegriffe bei Google',
    text: [
      'Welche Begriffe bringen Ihre Website schon heute in die Google-Ergebnisse? Die Liste zeigt sie mit Suchvolumen, Einblendungen, Klicks und durchschnittlicher Position.',
      'Wo noch kein Artikel existiert, erstellen Sie ihn mit einem Klick – dort, wo Google Sie ohnehin schon sieht, ist der Weg nach oben am kürzesten.',
    ],
    img: '/tour/06-google-suchbegriffe.webp', w: 1160, h: 750, badge: SC_BADGE,
    alt: 'Suchbegriffe aus der Google Search Console mit Suchvolumen, Position und Buttons zum Vormerken oder Erstellen',
  },
  {
    n: '07',
    title: 'Ranking-Übersicht auf einen Blick',
    text: [
      'Wie viele Suchbegriffe ranken, wie viele davon auf Seite 1, und wie sich die durchschnittliche Position über 90 Tage entwickelt.',
      'Für jede einzelne Seite zeigt ein Punkt pro Suchbegriff, wo er bei Google steht – je weiter links, desto besser. So sehen Sie, wie Ihre Website Woche für Woche an Sichtbarkeit gewinnt.',
    ],
    img: '/tour/07-ranking.webp', w: 1160, h: 1159, badge: SC_BADGE,
    alt: 'Ranking-Übersicht mit Kennzahlen, Verteilung der Positionen, Positionsverlauf und Suchbegriffen je Seite',
  },
  {
    n: '08',
    title: 'Alle Artikel im Überblick',
    text: [
      'Jeder veröffentlichte Artikel mit Suchbegriff, Adresse und Vorschau. Mit Search-Console-Verbindung sehen Sie außerdem, ob Google den Artikel bereits indexiert hat, wie oft er angezeigt und angeklickt wurde und auf welcher Position er steht.',
    ],
    img: '/tour/08-artikel.webp', w: 1160, h: 620,
    alt: 'Liste veröffentlichter Artikel mit Status, Suchbegriff und Adresse',
  },
  {
    n: '09',
    title: 'Live auf Ihrer eigenen Domain',
    text: [
      'Die Artikel erscheinen unter ihredomain.de/blog/ bzw. als Beiträge in Ihrem WordPress – nicht auf einer fremden Subdomain. Mit Titelbild und sauberer Überschriften-Struktur.',
      'Neue Artikel landen automatisch in der Sitemap Ihrer Website, die Google regelmäßig ausliest.',
    ],
    img: '/tour/09-artikel-live.webp', w: 1000, h: 1149, narrow: true,
    alt: 'Veröffentlichter Artikel auf firmenabwicklung.de mit Überschrift und Titelbild',
  },
  {
    n: '10',
    title: 'Auffindbar für Besucher und Google',
    text: [
      'Ein Artikel, auf den nichts verlinkt, wird nicht gefunden. Bei direkt angebundenen Websites legen wir deshalb eine Übersichtsseite aller Artikel an, verlinken sie von Ihrer Startseite („Ratgeber“) und tragen die Artikel-Sitemap in robots.txt ein. Unter jedem Artikel führt „Weitere Artikel“ zurück zur Übersicht.',
      'Bei WordPress übernimmt das Ihr vorhandener Blog mit seiner Sitemap.',
    ],
    img: '/tour/10-ratgeber-seite.webp', w: 1000, h: 1132, narrow: true,
    alt: 'Übersichtsseite aller Artikel auf firmenabwicklung.de',
  },
];

const plans = ['Free', 'Basic', 'Pro', 'Premium'];
const features: { label: string; on: boolean[] | string[] }[] = [
  { label: 'Neuer Artikel', on: ['alle 2 Wochen', '1× pro Woche', 'alle 2 Tage', 'täglich'] },
  { label: 'Website-Analyse und Themenplan', on: [true, true, true, true] },
  { label: 'Suchvolumen und Google-Ads-Preis je Suchbegriff', on: [true, true, true, true] },
  { label: 'Eigenen Suchbegriff prüfen', on: [true, true, true, true] },
  { label: 'Veröffentlichung auf Ihrer Domain, Sitemap, Ratgeber-Link', on: [true, true, true, true] },
  { label: 'Neue Artikel verlinken auf passende ältere Artikel', on: [false, false, true, true] },
  { label: 'Ältere Artikel verlinken zurück auf neue Artikel', on: [false, false, false, true] },
  { label: 'Artikel, die bei Google abrutschen, werden automatisch aufgefrischt', on: [false, false, false, true] },
  { label: 'Ohne suchmaschinen.pro-Badge auf Ihrer Website', on: [false, true, true, true] },
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
      <a href={s.img} target="_blank" rel="noopener" title="Screenshot in voller Größe öffnen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.img} width={s.w} height={s.h} alt={s.alt} loading={s.n === '01' ? 'eager' : 'lazy'}
          style={{ display: 'block', width: '100%', height: 'auto' }} />
      </a>
    </div>
  );
}

export default function RundgangPage() {
  return (
    <>
      <section style={{ padding: '4rem 1.5rem 2.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="section-label">Rundgang</div>
          <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem, 3.6vw, 2.4rem)', color: 'var(--ink)', margin: '0 0 1rem' }}>
            Was Sie bei suchmaschinen.pro bekommen
          </h1>
          <p style={{ ...p, fontSize: '1.02rem' }}>
            Keine Versprechen auf einer Folie, sondern das echte System – Schritt für Schritt, mit Screenshots aus einem laufenden Konto.
            Von der Registrierung bis zum Artikel, der auf Ihrer eigenen Domain steht.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>
        {steps.map((s, i) => (
          <section key={s.n} id={`schritt-${s.n}`}
            style={{
              display: 'grid',
              gridTemplateColumns: s.narrow ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
              gap: s.narrow ? '2.5rem' : '1.5rem',
              alignItems: 'center',
            }}>
            <div style={{ order: s.narrow && i % 2 === 1 ? 2 : 1, maxWidth: s.narrow ? 480 : 760, margin: s.narrow ? undefined : '0 auto', textAlign: s.narrow ? 'left' : 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--emerald)', fontSize: '0.9rem' }}>Schritt {s.n}</div>
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
            <div className="section-label">Leistungen je Tarif</div>
            <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
            <h2 style={{ ...h2, fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>Alles drin – ohne Zusatz-Abos</h2>
          </div>
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 620 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem 1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Leistung</th>
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
            Ranking-Übersicht, Ihre Google-Suchbegriffe und der Indexierungsstatus je Artikel benötigen eine Verbindung mit der Google Search Console und werden in Kürze für alle Kunden freigeschaltet.
          </p>
          <div style={{ display: 'flex', gap: '0.9rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link href="/auth?mode=register" className="btn-emerald" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>Kostenlos starten →</Link>
            <Link href="/#preise" className="btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '0.95rem' }}>Preise ansehen</Link>
          </div>
        </div>
      </section>
    </>
  );
}
