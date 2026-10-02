export const metadata = { title: 'Datenschutzerklärung', robots: { index: false, follow: true } };

const section = { fontSize: '1rem', marginTop: '1.75rem', marginBottom: '0.5rem', color: 'var(--ink)' } as const;
const p = { color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 0.6rem' } as const;

export default function DatenschutzPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginBottom: '2rem' }}>Datenschutzerklärung</h1>

      <h2 style={section}>1. Verantwortlicher</h2>
      <p style={p}>PAN21.COM Corporate Consultants Ltd, 61 Bridge Street, Kington, Herefordshire HR5 3DJ, United Kingdom. Kontakt: <a href="mailto:suchmaschinen@pan21.com" style={{ color: 'var(--emerald)' }}>suchmaschinen@pan21.com</a></p>

      <h2 style={section}>2. Registrierung &amp; Nutzerkonto</h2>
      <p style={p}>Bei der Registrierung erheben wir Ihre E-Mail-Adresse sowie ein von Ihnen gewähltes Passwort. Diese Daten werden bei unserem Auftragsverarbeiter Supabase Inc. gespeichert und ausschließlich zur Bereitstellung Ihres Nutzerkontos verwendet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>

      <h2 style={section}>3. Registrierte Websites</h2>
      <p style={p}>Die von Ihnen im Dashboard hinterlegten Domains und Notizen werden ausschließlich zur Erbringung der Dienstleistung (Analyse und Content-Erstellung) verarbeitet und sind nur für Ihr eigenes Konto einsehbar.</p>

      <h2 style={section}>4. Kontaktformular</h2>
      <p style={p}>Bei Kontaktaufnahme über das Formular verarbeiten wir die angegebenen Daten (Name, E-Mail, Nachricht) ausschließlich zur Bearbeitung Ihrer Anfrage. Der Versand erfolgt über den E-Mail-Dienstleister Resend, Inc. als Auftragsverarbeiter.</p>

      <h2 style={section}>5. Hosting</h2>
      <p style={p}>Diese Website wird über Vercel Inc. gehostet. Beim Aufruf werden automatisch technisch notwendige Informationen (u. a. IP-Adresse, Datum und Uhrzeit) in Server-Logfiles erfasst. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.</p>

      <h2 style={section}>6. Google Analytics-Anbindung (Google API Services)</h2>
      <p style={p}>Wenn Sie im Dashboard Ihre Website freiwillig mit Google Analytics verbinden, erhalten wir über die Google-Anmeldung (OAuth) einen ausschließlich lesenden Zugriff auf Ihre Google Analytics-Daten (Berechtigung „analytics.readonly“). Wir speichern dafür ein Zugriffstoken sowie die Kennung der von Ihnen ausgewählten Analytics-Property.</p>
      <p style={p}>Abgerufen werden ausschließlich aggregierte Kennzahlen Ihrer Website (Anzahl der Sitzungen und aktiven Nutzer pro Tag). Diese werden nur in Ihrem eigenen Dashboard angezeigt, um die Wirkung der veröffentlichten Artikel sichtbar zu machen. Die Daten werden nicht an Dritte weitergegeben, nicht verkauft, nicht für Werbung verwendet und nicht zum Training von KI-Modellen genutzt. Mitarbeiter haben keinen Zugriff darauf, außer mit Ihrer ausdrücklichen Zustimmung, zur Sicherheit oder aufgrund gesetzlicher Pflichten.</p>
      <p style={p}><strong>Technische und organisatorische Datenschutzmaßnahmen für diese sensiblen Daten:</strong> Die Übertragung zwischen Ihrem Browser, unseren Servern und den Google-APIs erfolgt ausschließlich verschlüsselt (TLS). Das OAuth-Zugriffstoken wird in unserer Datenbank (Supabase/PostgreSQL, serverseitig nach dem AES-256-Standard verschlüsselt gespeichert) abgelegt und ist über eine Row-Level-Security-Richtlinie ausschließlich für das jeweilige Nutzerkonto zugreifbar. Es wird kein Google-Passwort und keine sonstigen Google-Kontodaten gespeichert, sondern ausschließlich das Zugriffstoken und die Kennung der ausgewählten Analytics-Property. Das Token wird bis zum Widerruf durch Sie, bis zur Trennung der Verbindung im Dashboard oder bis zur Löschung Ihres Kontos vorgehalten und danach unverzüglich gelöscht; die abgerufenen aggregierten Kennzahlen werden nicht dauerhaft archiviert, sondern bei jedem Dashboard-Aufruf neu von Google abgerufen.</p>
      <p style={p}>Die Nutzung und Weitergabe von Informationen, die wir von Google-APIs erhalten, erfolgt in Übereinstimmung mit der <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener" style={{ color: 'var(--emerald)' }}>Google API Services User Data Policy</a>, einschließlich der Anforderungen zur eingeschränkten Nutzung (Limited Use).</p>
      <p style={p}><em>suchmaschinen.pro&apos;s use and transfer of information received from Google APIs to any other app will adhere to the Google API Services User Data Policy, including the Limited Use requirements.</em></p>
      <p style={p}>Sie können die Verbindung jederzeit unter <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener" style={{ color: 'var(--emerald)' }}>myaccount.google.com/permissions</a> widerrufen oder uns per E-Mail um Löschung bitten; das gespeicherte Token wird dann gelöscht. Rechtsgrundlage ist Ihre Einwilligung, Art. 6 Abs. 1 lit. a DSGVO.</p>

      <h2 style={section}>7. Ihre Rechte</h2>
      <p style={p}>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten sowie ein Widerspruchsrecht und ein Recht auf Datenübertragbarkeit. Wenden Sie sich hierzu an <a href="mailto:suchmaschinen@pan21.com" style={{ color: 'var(--emerald)' }}>suchmaschinen@pan21.com</a>.</p>
    </div>
  );
}
