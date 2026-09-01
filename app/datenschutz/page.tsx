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

      <h2 style={section}>6. Ihre Rechte</h2>
      <p style={p}>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten sowie ein Widerspruchsrecht und ein Recht auf Datenübertragbarkeit. Wenden Sie sich hierzu an <a href="mailto:suchmaschinen@pan21.com" style={{ color: 'var(--emerald)' }}>suchmaschinen@pan21.com</a>.</p>
    </div>
  );
}
