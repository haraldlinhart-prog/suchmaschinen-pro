import Link from 'next/link';

export const metadata = {
  title: 'WordPress-Anleitung',
  description: 'So veröffentlicht suchmaschinen.pro Artikel als echte WordPress-Beiträge: Anwendungspasswort erstellen, Zugangsdaten eintragen, fertig.',
  alternates: { canonical: 'https://www.suchmaschinen.pro/hilfe/wordpress' },
};

const sectionStyle = { fontSize: '1.1rem', marginTop: '2.2rem', marginBottom: '0.6rem', color: 'var(--ink)', fontFamily: 'var(--font-display)' } as const;
const pStyle = { color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 0.6rem' } as const;

export default function WordPressHelpPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <Link href="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>&larr; Zurück zum Dashboard</Link>

      <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
        <div className="section-label">Anleitung</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginTop: '0.4rem' }}>
          Artikel auf WordPress veröffentlichen
        </h1>
        <p style={pStyle}>
          Für WordPress-Websites veröffentlichen wir Artikel direkt als echte WordPress-Beiträge über die eingebaute REST-API. Kein Plugin, keine Weiterleitungsregel nötig — nur ein Anwendungspasswort.
        </p>
      </div>

      <h2 style={sectionStyle}>1. Anwendungspasswort erstellen</h2>
      <p style={pStyle}>
        In WordPress einloggen und zu <strong>Benutzer → Profil</strong> gehen. Ganz unten den Abschnitt <strong>&bdquo;Anwendungspasswörter&ldquo;</strong> aufklappen, einen beliebigen Namen eingeben (z. B. &bdquo;suchmaschinen.pro&ldquo;) und auf <strong>&bdquo;Neues Anwendungspasswort hinzufügen&ldquo;</strong> klicken.
      </p>
      <p style={pStyle}>
        WordPress zeigt das erzeugte Passwort (Format <code>xxxx xxxx xxxx xxxx xxxx xxxx</code>) <strong>nur einmal</strong> an — sofort kopieren.
      </p>
      <p style={pStyle}>
        Diese Funktion ist seit WordPress 5.6 fest eingebaut. Voraussetzung ist eine Website mit <strong>HTTPS</strong>. Manche Security-Plugins oder Multisite-Netzwerke deaktivieren Anwendungspasswörter — fehlt der Abschnitt im Profil, dort nachschauen.
      </p>

      <h2 style={sectionStyle}>2. Zugangsdaten bei suchmaschinen.pro eintragen</h2>
      <p style={pStyle}>Bei der jeweiligen Website drei Angaben hinterlegen:</p>
      <ul style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li><strong>WordPress-URL</strong> — die tatsächliche Adresse der Seite, auf der veröffentlicht werden soll (z. B. <code>https://ihredomain.de</code>)</li>
        <li><strong>Benutzername</strong> — der WordPress-Login-Name, <em>nicht</em> Ihre E-Mail-Adresse bei suchmaschinen.pro</li>
        <li><strong>Anwendungspasswort</strong> — der in Schritt 1 erzeugte Wert</li>
      </ul>

      <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', borderRadius: 8, padding: '1rem 1.2rem', margin: '1.2rem 0' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Multisite-Netzwerke:</strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
          Bitte die URL der <strong>konkreten Subsite</strong> eintragen, auf der die Artikel erscheinen sollen — nicht zwingend die Netzwerk-Hauptdomain.
        </p>
      </div>

      <h2 style={sectionStyle}>3. Was beim Veröffentlichen passiert</h2>
      <ul style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li>Der Artikel wird als <strong>echter WordPress-Beitrag</strong> angelegt (Status: veröffentlicht)</li>
        <li>Die <strong>Beitrags-URL bestimmt WordPress selbst</strong> — nach Ihrer Permalink-Einstellung (Einstellungen → Permalinks). Ein &bdquo;gewünschter Pfad&ldquo; wie <code>/blog/</code> lässt sich hier nicht erzwingen.</li>
        <li>Autor des Beitrags ist der Benutzer, dessen Anwendungspasswort verwendet wurde</li>
        <li>Das Titelbild des Artikels wird in Ihre Mediathek hochgeladen und als <strong>Beitragsbild</strong> gesetzt</li>
        <li>Der Beitrag landet zunächst <strong>ohne Kategorie</strong> (&bdquo;Allgemein&ldquo; bzw. &bdquo;Uncategorized&ldquo;) — das können Sie in WordPress jederzeit nachträglich anpassen</li>
      </ul>

      <h2 style={sectionStyle}>4. Für saubere SEO-URLs</h2>
      <p style={pStyle}>
        Falls Ihre Permalink-Einstellung noch auf &bdquo;Einfach&ldquo; steht (URLs wie <code>?p=123</code>), empfehlen wir, in WordPress unter <strong>Einstellungen → Permalinks</strong> auf <strong>&bdquo;Beitragsname&ldquo;</strong> umzustellen — das ergibt lesbare, SEO-freundliche URLs.
      </p>

      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <Link href="/dashboard" className="btn-emerald" style={{ display: 'inline-flex' }}>Zurück zum Dashboard</Link>
      </div>
    </div>
  );
}
