import Link from 'next/link';
import VideoTutorial from './VideoTutorial';

export const metadata = { title: 'Facebook-Seite verbinden – Anleitung' };

const sectionStyle = { fontSize: '1.1rem', marginTop: '2.2rem', marginBottom: '0.6rem', color: 'var(--ink)', fontFamily: 'var(--font-display)' } as const;
const pStyle = { color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 0.6rem' } as const;

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
          Wenn du eine Facebook Page-ID und einen Page Access Token hinterlegst, postet suchmaschinen.pro jeden neuen Artikel automatisch auf deine Facebook-Seite — mit Titel, Teaser und direktem Link zum Artikel. Facebook generiert die Vorschaukarte selbst.
        </p>
      </div>

      <h2 style={sectionStyle}>Was du brauchst</h2>
      <ul style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li>Eine Facebook-Seite (Page), die du verwaltest — kein privates Profil</li>
        <li>Ein kostenloses Meta-Entwicklerkonto auf <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)' }}>developers.facebook.com</a> (Registrierung mit dem bestehenden Facebook-Login, kostenlos)</li>
      </ul>

      <h2 style={sectionStyle}>1. Facebook-Seite anlegen (falls noch keine vorhanden)</h2>
      <p style={pStyle}>
        Auf <a href="https://www.facebook.com/pages/create" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)' }}>facebook.com/pages/create</a> eine neue Seite erstellen. Kategorie wählen, Name eintragen, fertig — das dauert unter 5 Minuten. Neue Seiten ohne Follower sind kein Problem; der erste Artikel wird trotzdem gepostet.
      </p>

      <VideoTutorial />

      <h2 style={sectionStyle}>2. Page-ID herausfinden</h2>
      <p style={pStyle}>
        Die Facebook-Seite aufrufen. In der URL steht entweder eine Zahl (<code>facebook.com/123456789012345</code>) — das ist direkt die Page-ID. Oder ein Name (<code>facebook.com/meinefirma</code>) — dann auf der Seite auf <strong>„Über"</strong> klicken und ganz unten nach <strong>„Seiten-ID"</strong> suchen.
      </p>
      <p style={pStyle}>
        Alternativ: Im <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)' }}>Graph API Explorer</a> als Abfrage <code>me/accounts</code> eingeben (nach Schritt 3) — dort werden alle verwalteten Seiten mit ID aufgelistet.
      </p>

      <h2 style={sectionStyle}>3. Meta Developer App erstellen</h2>
      <p style={pStyle}>
        Einmalig nötig. Auf <a href="https://developers.facebook.com/apps/create" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)' }}>developers.facebook.com/apps/create</a> eine neue App anlegen:
      </p>
      <ol style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li style={{ marginBottom: '0.5rem' }}>App-Typ: <strong>„Andere"</strong> wählen → weiter → <strong>„Business"</strong> wählen → weiter.</li>
        <li style={{ marginBottom: '0.5rem' }}>Einen beliebigen App-Namen eingeben (z. B. „meinefirma-posts"), E-Mail-Adresse bestätigen → <strong>„App erstellen"</strong>.</li>
        <li style={{ marginBottom: '0.5rem' }}>Im App-Dashboard links auf <strong>„Anwendungsfälle"</strong> klicken → <strong>„Content-Management"</strong> auswählen → <strong>„Einrichten"</strong>.</li>
        <li style={{ marginBottom: '0.5rem' }}>Unter „Berechtigungen und Features" bei <strong><code>pages_manage_posts</code></strong> und <strong><code>pages_read_engagement</code></strong> jeweils auf <strong>„+ Hinzufügen"</strong> klicken.</li>
      </ol>
      <div style={{ background: '#fff8e8', border: '1px solid #e8c840', borderRadius: 8, padding: '1rem 1.2rem', margin: '0.8rem 0' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>⚠️ Wichtig: Anwendungsfall zuerst</strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
          Ohne den Anwendungsfall „Content-Management" erscheinen <code>pages_manage_posts</code> und <code>pages_read_engagement</code> im Graph API Explorer gar nicht. Der Anwendungsfall muss zuerst aktiviert werden.
        </p>
      </div>

      <h2 style={sectionStyle}>4. Page Access Token erstellen</h2>
      <p style={pStyle}>
        Den <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)' }}>Graph API Explorer</a> öffnen (mit Facebook-Account einloggen).
      </p>
      <ol style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li style={{ marginBottom: '0.5rem' }}>Oben rechts bei <strong>„Meta App"</strong> die soeben erstellte App auswählen.</li>
        <li style={{ marginBottom: '0.5rem' }}>Auf <strong>„Berechtigungen hinzufügen"</strong> klicken und folgende zwei aktivieren: <code>pages_manage_posts</code> und <code>pages_read_engagement</code>.</li>
        <li style={{ marginBottom: '0.5rem' }}>Auf <strong>„Token generieren"</strong> klicken. Facebook fragt, auf welche Seite(n) Zugriff erlaubt wird — die gewünschte Seite auswählen und bestätigen.</li>
        <li style={{ marginBottom: '0.5rem' }}>Auf <strong>„Abfragen"</strong> klicken und als Abfrage <code>me/accounts</code> eingeben → ausführen. Die Antwort zeigt alle deine Facebook-Seiten mit <code>id</code> und <code>access_token</code> — beides für die gewünschte Seite notieren.</li>
      </ol>
      <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', borderRadius: 8, padding: '1rem 1.2rem', margin: '0.8rem 0' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>💡 me/accounts ist der einfachste Weg</strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
          Die Abfrage <code>me/accounts</code> liefert in einem Schritt sowohl die Page-ID als auch einen gültigen Page Access Token für jede deiner Seiten. Den Token aus der Antwort direkt in Schritt 5 verwenden — er ist bereits ein Long-Lived Page Token und muss nicht mehr umgewandelt werden.
        </p>
      </div>

      <h2 style={sectionStyle}>5. Long-Lived Token erzeugen (wichtig!)</h2>
      <p style={pStyle}>
        Der kurze Token hält nur 1 Stunde. Für den automatischen Dauerbetrieb braucht es einen <strong>Long-Lived Page Access Token</strong>, der 60 Tage gültig ist (und sich bei regelmäßiger Nutzung automatisch verlängert).
      </p>
      <p style={pStyle}>
        Im Graph API Explorer folgende Abfrage eingeben — <code>SHORT_LIVED_TOKEN</code> durch den gerade kopierten Token ersetzen, <code>APP_ID</code> und <code>APP_SECRET</code> aus der Meta-App-Einstellungsseite holen:
      </p>
      <pre style={{ background: 'var(--paper-dark)', borderRadius: 6, padding: '0.9rem 1rem', fontSize: '0.8rem', overflowX: 'auto', color: 'var(--ink)' }}>
{`GET /oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=APP_ID
  &client_secret=APP_SECRET
  &fb_exchange_token=SHORT_LIVED_TOKEN`}
      </pre>
      <p style={pStyle}>
        Die Antwort enthält einen neuen, 60-Tage-gültigen Token. Diesen Token dann noch einmal für die konkrete Seite austauschen — Abfrage:
      </p>
      <pre style={{ background: 'var(--paper-dark)', borderRadius: 6, padding: '0.9rem 1rem', fontSize: '0.8rem', overflowX: 'auto', color: 'var(--ink)' }}>
{`GET /PAGE_ID?fields=access_token
  &access_token=LONG_LIVED_USER_TOKEN`}
      </pre>
      <p style={pStyle}>
        Das Feld <code>access_token</code> in der Antwort ist der fertige <strong>Long-Lived Page Access Token</strong> — dieser wird bei suchmaschinen.pro eingetragen.
      </p>

      <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', borderRadius: 8, padding: '1rem 1.2rem', margin: '1.2rem 0' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Tipp: Token einfacher holen</strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
          Tools wie <a href="https://www.fbstatus.com/token" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)' }}>fbstatus.com/token</a> oder der <a href="https://developers.facebook.com/tools/accesstoken/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)' }}>Access Token Debugger</a> helfen, Long-Lived Page Tokens ohne manuelles API-Aufrufen zu erzeugen.
        </p>
      </div>

      <h2 style={sectionStyle}>6. Token bei suchmaschinen.pro eintragen</h2>
      <p style={pStyle}>
        Im Dashboard die jeweilige Website bearbeiten und in den Feldern <strong>„Facebook Page-ID"</strong> und <strong>„Facebook Page Access Token"</strong> die Werte aus den Schritten 2 und 4 eintragen. Ab dem nächsten veröffentlichten Artikel wird automatisch ein Post auf der Facebook-Seite erstellt.
      </p>

      <div style={{ background: '#fff8e8', border: '1px solid #e8c840', borderRadius: 8, padding: '1rem 1.2rem', margin: '1.2rem 0' }}>
        <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>Token nach 60 Tagen erneuern</strong>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
          Wird die Seite regelmäßig bespielt (mindestens alle 60 Tage ein Artikel), verlängert Facebook den Token automatisch. Läuft er trotzdem ab, erscheint im Dashboard eine Fehlermeldung beim nächsten Publish — dann einfach einen neuen Token nach derselben Anleitung erstellen und eintragen.
        </p>
      </div>

      <h2 style={sectionStyle}>Was im Post erscheint</h2>
      <ul style={{ ...pStyle, paddingLeft: '1.2rem' }}>
        <li>Der Artikeltitel und die Meta-Beschreibung als Text</li>
        <li>Der direkte Link zum Artikel</li>
        <li>Eine automatische Vorschaukarte mit Bild, die Facebook aus den Open-Graph-Tags der Seite zieht</li>
      </ul>
      <p style={pStyle}>
        Der Post erscheint sofort nach dem Veröffentlichen des Artikels — auch beim automatischen Cron-Publish.
      </p>

      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <Link href="/dashboard" className="btn-emerald" style={{ display: 'inline-flex' }}>Zurück zum Dashboard</Link>
      </div>
    </div>
  );
}
