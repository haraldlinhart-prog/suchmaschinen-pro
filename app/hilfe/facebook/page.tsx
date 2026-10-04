import Link from 'next/link';
import type { Metadata } from 'next';
import VideoTutorial from './VideoTutorial';

export const metadata: Metadata = {
  title: 'Facebook-Seite verbinden – Anleitung',
  description: 'Schritt für Schritt: Page-ID und Page Access Token erstellen, damit suchmaschinen.pro jeden neuen Artikel automatisch auf Ihrer Facebook-Seite teilt.',
  alternates: { canonical: 'https://www.suchmaschinen.pro/hilfe/facebook' },
};

const sectionStyle = { fontSize: '1.1rem', marginTop: '2.2rem', marginBottom: '0.6rem', color: 'var(--ink)', fontFamily: 'var(--font-display)' } as const;
const pStyle = { color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 0.6rem' } as const;
const link = { color: 'var(--emerald)' } as const;
const pre = { background: 'var(--paper-dark)', borderRadius: 6, padding: '0.9rem 1rem', fontSize: '0.8rem', overflowX: 'auto', color: 'var(--ink)' } as const;

export default function FacebookHelpPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <Link href="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>&larr; Zurück zum Dashboard</Link>

      <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
        <div className="section-label">Anleitung</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginTop: '0.4rem' }}>
          Facebook-Seite verbinden
        </h1>
        <p style={pStyle}>
          Wenn Sie eine Facebook-Page-ID und einen Page Access Token hinterlegen, teilt suchmaschinen.pro jeden neuen Artikel automatisch auf Ihrer Facebook-Seite — mit einem kurzen Teaser und dem direkten Link zum Artikel. Die Vorschaukarte mit Titel und Bild erzeugt Facebook selbst.
        </p>
      </div>

      <h2 style={sectionStyle}>Was Sie brauchen</h2>
      <ul style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li>Eine Facebook-Seite (Page), die Sie verwalten — kein privates Profil</li>
        <li>Ein Meta-Entwicklerkonto auf <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" style={link}>developers.facebook.com</a> (kostenlos, Registrierung mit Ihrem bestehenden Facebook-Login)</li>
      </ul>

      <h2 style={sectionStyle}>1. Facebook-Seite anlegen (falls noch keine vorhanden)</h2>
      <p style={pStyle}>
        Auf <a href="https://www.facebook.com/pages/create" target="_blank" rel="noopener noreferrer" style={link}>facebook.com/pages/create</a> eine neue Seite erstellen: Kategorie wählen, Namen eintragen, fertig — das dauert keine 5 Minuten. Neue Seiten ohne Follower sind kein Problem; der erste Artikel wird trotzdem gepostet.
      </p>

      <VideoTutorial />

      <h2 style={sectionStyle}>2. Page-ID herausfinden</h2>
      <p style={pStyle}>
        Rufen Sie Ihre Facebook-Seite auf. Steht in der Adresse eine Zahl (<code>facebook.com/123456789012345</code>), ist das direkt die Page-ID. Steht dort ein Name (<code>facebook.com/meinefirma</code>), finden Sie die ID auf der Seite unter <strong>„Info“</strong> bzw. <strong>„Seitentransparenz“</strong>.
      </p>
      <p style={pStyle}>
        Einfacher: Die Abfrage <code>me/accounts</code> im Graph API Explorer (Schritt 5) listet alle Ihre Seiten mit ID auf.
      </p>

      <h2 style={sectionStyle}>3. Meta-App erstellen</h2>
      <p style={pStyle}>
        Einmalig nötig. Auf <a href="https://developers.facebook.com/apps/create" target="_blank" rel="noopener noreferrer" style={link}>developers.facebook.com/apps/create</a> eine neue App anlegen:
      </p>
      <ol style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li style={{ marginBottom: '0.5rem' }}>App-Typ <strong>„Andere“</strong> wählen → weiter → <strong>„Business“</strong> wählen → weiter.</li>
        <li style={{ marginBottom: '0.5rem' }}>Einen beliebigen App-Namen eingeben (z. B. „meinefirma-posts“), E-Mail-Adresse bestätigen → <strong>„App erstellen“</strong>.</li>
        <li style={{ marginBottom: '0.5rem' }}>Im App-Dashboard links auf <strong>„Anwendungsfälle“</strong> klicken → <strong>„Content-Management“</strong> auswählen → <strong>„Einrichten“</strong>.</li>
        <li style={{ marginBottom: '0.5rem' }}>Unter „Berechtigungen und Features“ bei <strong><code>pages_manage_posts</code></strong> und <strong><code>pages_read_engagement</code></strong> jeweils auf <strong>„+ Hinzufügen“</strong> klicken.</li>
      </ol>
      <div style={{ background: '#fff8e8', border: '1px solid #e8c840', borderRadius: 8, padding: '1rem 1.2rem', margin: '0.8rem 0' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>⚠️ Wichtig: zuerst den Anwendungsfall</strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
          Ohne den Anwendungsfall „Content-Management“ erscheinen <code>pages_manage_posts</code> und <code>pages_read_engagement</code> im Graph API Explorer gar nicht.
        </p>
      </div>

      <h2 style={sectionStyle}>4. Nutzer-Token erzeugen</h2>
      <p style={pStyle}>
        Öffnen Sie den <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" style={link}>Graph API Explorer</a> und melden Sie sich mit Ihrem Facebook-Konto an.
      </p>
      <ol style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li style={{ marginBottom: '0.5rem' }}>Oben rechts unter <strong>„Meta App“</strong> die soeben erstellte App auswählen.</li>
        <li style={{ marginBottom: '0.5rem' }}>Unter <strong>„Berechtigungen hinzufügen“</strong> die beiden Berechtigungen <code>pages_manage_posts</code> und <code>pages_read_engagement</code> aktivieren.</li>
        <li style={{ marginBottom: '0.5rem' }}>Auf <strong>„Token generieren“</strong> klicken. Facebook fragt, für welche Seite(n) der Zugriff erlaubt wird — die gewünschte Seite auswählen und bestätigen.</li>
      </ol>
      <p style={pStyle}>
        Der so erzeugte Nutzer-Token ist nur etwa eine Stunde gültig. Damit die automatische Veröffentlichung dauerhaft läuft, wandeln Sie ihn im nächsten Schritt in einen dauerhaften Page Access Token um.
      </p>

      <h2 style={sectionStyle}>5. Dauerhaften Page Access Token erzeugen (wichtig!)</h2>
      <p style={pStyle}>
        Zuerst den kurzlebigen Nutzer-Token in einen langlebigen umwandeln. Im Graph API Explorer folgende Abfrage ausführen — <code>SHORT_LIVED_TOKEN</code> durch den Token aus Schritt 4 ersetzen; <code>APP_ID</code> und <code>APP_SECRET</code> finden Sie in den Einstellungen Ihrer Meta-App:
      </p>
      <pre style={pre}>
{`GET /oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=APP_ID
  &client_secret=APP_SECRET
  &fb_exchange_token=SHORT_LIVED_TOKEN`}
      </pre>
      <p style={pStyle}>
        Mit dem langlebigen Nutzer-Token aus der Antwort fragen Sie nun den Page Access Token ab:
      </p>
      <pre style={pre}>
{`GET /me/accounts?access_token=LONG_LIVED_USER_TOKEN`}
      </pre>
      <p style={pStyle}>
        Die Antwort listet alle Ihre Seiten mit <code>id</code> (der Page-ID) und <code>access_token</code>. Dieser <code>access_token</code> ist Ihr dauerhafter Page Access Token — er wird bei suchmaschinen.pro eingetragen.
      </p>

      <h2 style={sectionStyle}>6. Werte bei suchmaschinen.pro eintragen</h2>
      <p style={pStyle}>
        Im Dashboard die jeweilige Website bearbeiten und in die Felder <strong>„Facebook Page-ID“</strong> und <strong>„Facebook Page Access Token“</strong> die Werte aus Schritt 5 eintragen. Ab dem nächsten veröffentlichten Artikel wird automatisch ein Post auf Ihrer Facebook-Seite erstellt.
      </p>

      <div style={{ background: '#fff8e8', border: '1px solid #e8c840', borderRadius: 8, padding: '1rem 1.2rem', margin: '1.2rem 0' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Wann muss der Token erneuert werden?</strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
          Ein Page Access Token, der wie oben aus einem langlebigen Nutzer-Token erzeugt wurde, hat kein Ablaufdatum. Ungültig wird er, wenn Sie Ihr Facebook-Passwort ändern, der App die Berechtigungen entziehen oder Ihre Administratorrolle für die Seite verlieren. Erscheinen keine neuen Posts mehr auf Ihrer Seite, erzeugen Sie einfach nach dieser Anleitung einen neuen Token und tragen ihn ein.
        </p>
      </div>

      <h2 style={sectionStyle}>Optional: zusätzlich auf Instagram posten</h2>
      <p style={pStyle}>
        Ist mit Ihrer Facebook-Seite ein Instagram-Konto verknüpft, kann suchmaschinen.pro jeden neuen Artikel auch dort veröffentlichen — mit demselben Page Access Token, ein eigener Instagram-Token ist nicht nötig. Voraussetzungen:
      </p>
      <ol style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li style={{ marginBottom: '0.5rem' }}>Ein <strong>professionelles Instagram-Konto</strong> (Business oder Creator), das in den Einstellungen der Facebook-Seite unter <strong>„Verknüpfte Konten“</strong> mit der Seite verbunden ist.</li>
        <li style={{ marginBottom: '0.5rem' }}>In Ihrer Meta-App unter <strong>„Anwendungsfälle hinzufügen“ → „Content-Management“</strong> den Anwendungsfall <strong>„Messaging und Content auf Instagram verwalten“</strong> hinzufügen. Beim Anpassen die Variante <strong>„API-Einrichtung mit Facebook-Login“</strong> wählen und unter „Berechtigungen und Features“ bei <code>instagram_basic</code> und <code>instagram_content_publish</code> auf <strong>„+ Hinzufügen“</strong> klicken. Den erweiterten Zugriff bzw. die App-Review brauchen Sie dafür nicht.</li>
        <li style={{ marginBottom: '0.5rem' }}>Den Token wie in Schritt 4 und 5 neu erzeugen und dabei zusätzlich <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>pages_show_list</code> und <code>business_management</code> aktivieren.</li>
      </ol>
      <p style={pStyle}>
        Nach <strong>„Token prüfen“</strong> erkennt das Dashboard das verknüpfte Instagram-Konto und bietet die Option <strong>„Auch auf Instagram posten“</strong> an. Fehlt eine Berechtigung, steht dort, welche.
      </p>
      <p style={pStyle}>
        Der Instagram-Beitrag besteht aus dem Artikelbild, dem Titel, einem kurzen Teaser, der Adresse des Artikels und einigen passenden Hashtags. Links sind in Instagram-Texten nicht anklickbar; die Adresse steht deshalb gut lesbar am Ende. Artikel ohne Bild werden auf Instagram übersprungen.
      </p>

      <h2 style={sectionStyle}>Was im Facebook-Post erscheint</h2>
      <ul style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li>Die Meta-Beschreibung des Artikels (oder ein kurzer Auszug daraus) als Text</li>
        <li>Der direkte Link zum Artikel</li>
        <li>Eine Vorschaukarte mit Titel und Bild, die Facebook automatisch aus den Open-Graph-Angaben des Artikels erzeugt</li>
      </ul>
      <p style={pStyle}>
        Der Post erscheint unmittelbar nach dem Veröffentlichen des Artikels — auch bei der automatischen Veröffentlichung.
      </p>

      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <Link href="/dashboard" className="btn-emerald" style={{ display: 'inline-flex' }}>Zurück zum Dashboard</Link>
      </div>
    </div>
  );
}
