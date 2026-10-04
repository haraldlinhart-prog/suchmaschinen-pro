import type { Metadata } from 'next';
import { getLocale, pageMetadata } from '@/lib/seo';

// Served as /datenschutz on suchmaschinen.pro and as /privacy on search-engines.pro (middleware.ts).
export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === 'en'
    ? pageMetadata('privacy', 'en', { title: 'Privacy policy', description: 'How search-engines.pro processes personal data.', noindex: true })
    : pageMetadata('privacy', 'de', { title: 'Datenschutzerklärung', description: 'Wie suchmaschinen.pro personenbezogene Daten verarbeitet.', noindex: true });
}

const section = { fontSize: '1rem', marginTop: '1.75rem', marginBottom: '0.5rem', color: 'var(--ink)' } as const;
const p = { color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: '0 0 0.6rem' } as const;
const a = { color: 'var(--emerald)' } as const;
const MAIL = <a href="mailto:suchmaschinen@pan21.com" style={a}>suchmaschinen@pan21.com</a>;
const POLICY = <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener" style={a}>Google API Services User Data Policy</a>;
const PERMISSIONS = <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener" style={a}>myaccount.google.com/permissions</a>;

function German() {
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginBottom: '2rem' }}>Datenschutzerklärung</h1>

      <h2 style={section}>1. Verantwortlicher</h2>
      <p style={p}>PAN21.com International LLC, vertreten durch Harald Linhart, 7533 South Center View CT, STE R, 84084 West Jordan, Utah, USA. Telefon: +49 30 5684450-0, E-Mail: {MAIL}</p>

      <h2 style={section}>2. Registrierung &amp; Nutzerkonto</h2>
      <p style={p}>Bei der Registrierung erheben wir Ihre E-Mail-Adresse sowie ein von Ihnen gewähltes Passwort. Diese Daten werden bei unserem Auftragsverarbeiter Supabase Inc. gespeichert und ausschließlich zur Bereitstellung Ihres Nutzerkontos verwendet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>

      <h2 style={section}>3. Registrierte Websites</h2>
      <p style={p}>Die von Ihnen im Dashboard hinterlegten Domains und Notizen werden ausschließlich zur Erbringung der Dienstleistung (Analyse und Content-Erstellung) verarbeitet und sind nur für Ihr eigenes Konto einsehbar.</p>

      <h2 style={section}>4. Kontaktformular</h2>
      <p style={p}>Bei Kontaktaufnahme über das Formular verarbeiten wir die angegebenen Daten (Name, E-Mail-Adresse, Nachricht) ausschließlich zur Bearbeitung Ihrer Anfrage. Der Versand erfolgt über den E-Mail-Dienstleister Resend, Inc. als Auftragsverarbeiter.</p>

      <h2 style={section}>5. Hosting</h2>
      <p style={p}>Diese Website wird über Vercel Inc. gehostet. Beim Aufruf werden automatisch technisch notwendige Informationen (u. a. IP-Adresse, Datum und Uhrzeit) in Server-Logfiles erfasst. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.</p>

      <h2 style={section}>6. Google-Analytics-Anbindung (Google API Services)</h2>
      <p style={p}>Wenn Sie im Dashboard Ihre Website freiwillig mit Google Analytics verbinden, erhalten wir über die Google-Anmeldung (OAuth) einen ausschließlich lesenden Zugriff auf Ihre Google-Analytics-Daten (Berechtigung „analytics.readonly“). Wir speichern dafür ein Zugriffstoken sowie die Kennung der von Ihnen ausgewählten Analytics-Property.</p>
      <p style={p}>Abgerufen werden ausschließlich aggregierte Kennzahlen Ihrer Website (Anzahl der Sitzungen und aktiven Nutzer pro Tag). Diese werden nur in Ihrem eigenen Dashboard angezeigt, um die Wirkung der veröffentlichten Artikel sichtbar zu machen. Die Daten werden nicht an Dritte weitergegeben, nicht verkauft, nicht für Werbung verwendet und nicht zum Training von KI-Modellen genutzt. Mitarbeiter haben keinen Zugriff darauf, außer mit Ihrer ausdrücklichen Zustimmung, zur Sicherheit oder aufgrund gesetzlicher Pflichten.</p>
      <p style={p}><strong>Technische und organisatorische Datenschutzmaßnahmen für diese sensiblen Daten:</strong> Die Übertragung zwischen Ihrem Browser, unseren Servern und den Google-APIs erfolgt ausschließlich verschlüsselt (TLS). Das OAuth-Zugriffstoken wird in unserer Datenbank (Supabase/PostgreSQL, serverseitig nach dem AES-256-Standard verschlüsselt gespeichert) abgelegt und ist über eine Row-Level-Security-Richtlinie ausschließlich für das jeweilige Nutzerkonto zugreifbar. Es werden weder Ihr Google-Passwort noch sonstige Google-Kontodaten gespeichert, sondern ausschließlich das Zugriffstoken und die Kennung der ausgewählten Analytics-Property. Das Token wird bis zum Widerruf durch Sie, bis zur Trennung der Verbindung im Dashboard oder bis zur Löschung Ihres Kontos vorgehalten und danach unverzüglich gelöscht; die abgerufenen aggregierten Kennzahlen werden nicht dauerhaft archiviert, sondern bei jedem Dashboard-Aufruf neu von Google abgerufen.</p>
      <p style={p}>Die Nutzung und Weitergabe von Informationen, die wir von Google-APIs erhalten, erfolgt in Übereinstimmung mit der {POLICY}, einschließlich der Anforderungen zur eingeschränkten Nutzung (Limited Use).</p>
      <p style={p} lang="en"><em>suchmaschinen.pro&apos;s use and transfer of information received from Google APIs to any other app will adhere to the Google API Services User Data Policy, including the Limited Use requirements.</em></p>
      <p style={p}>Sie können die Verbindung jederzeit unter {PERMISSIONS} widerrufen oder uns per E-Mail um Löschung bitten; das gespeicherte Token wird dann gelöscht. Rechtsgrundlage ist Ihre Einwilligung, Art. 6 Abs. 1 lit. a DSGVO.</p>

      <h2 style={section}>7. Ihre Rechte</h2>
      <p style={p}>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten sowie ein Widerspruchsrecht und ein Recht auf Datenübertragbarkeit. Wenden Sie sich hierzu an {MAIL}.</p>
    </>
  );
}

function English() {
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginBottom: '2rem' }}>Privacy policy</h1>

      <h2 style={section}>1. Controller</h2>
      <p style={p}>PAN21.com International LLC, represented by Harald Linhart, 7533 South Center View CT, STE R, 84084 West Jordan, Utah, USA. Phone: +49 30 5684450-0, email: {MAIL}</p>

      <h2 style={section}>2. Registration &amp; user account</h2>
      <p style={p}>When you register, we collect your email address and a password of your choice. This data is stored by our processor Supabase Inc. and used solely to provide your user account. The legal basis is Art. 6(1)(b) GDPR.</p>

      <h2 style={section}>3. Registered websites</h2>
      <p style={p}>The domains and notes you enter in the dashboard are processed solely to provide the service (analysis and content creation) and are visible only to your own account.</p>

      <h2 style={section}>4. Contact form</h2>
      <p style={p}>If you contact us via the form, we process the data you provide (name, email address, message) solely to handle your enquiry. Messages are sent via the email service provider Resend, Inc., acting as our processor.</p>

      <h2 style={section}>5. Hosting</h2>
      <p style={p}>This website is hosted by Vercel Inc. When you visit it, technically necessary information (including IP address, date and time) is automatically recorded in server log files. The legal basis is Art. 6(1)(f) GDPR.</p>

      <h2 style={section}>6. Google Analytics connection (Google API Services)</h2>
      <p style={p}>If you voluntarily connect your website to Google Analytics in the dashboard, we receive read-only access to your Google Analytics data via Google sign-in (OAuth) (scope “analytics.readonly”). For this purpose we store an access token and the ID of the Analytics property you selected.</p>
      <p style={p}>We retrieve only aggregated metrics for your website (number of sessions and active users per day). They are shown only in your own dashboard to make the effect of the published articles visible. The data is not shared with third parties, not sold, not used for advertising and not used to train AI models. Staff have no access to it except with your explicit consent, for security purposes or to comply with legal obligations.</p>
      <p style={p}><strong>Technical and organisational measures protecting this sensitive data:</strong> All transmission between your browser, our servers and the Google APIs is encrypted (TLS). The OAuth access token is stored in our database (Supabase/PostgreSQL, encrypted at rest on the server side using AES-256) and, through a row-level security policy, is accessible only to the respective user account. We store neither your Google password nor any other Google account data — only the access token and the ID of the selected Analytics property. The token is kept until you revoke it, disconnect it in the dashboard or delete your account, and is deleted without delay afterwards; the aggregated metrics are not archived permanently but fetched from Google again each time you open the dashboard.</p>
      <p style={p}>search-engines.pro&apos;s use and transfer of information received from Google APIs to any other app will adhere to the {POLICY}, including the Limited Use requirements.</p>
      <p style={p}>You can revoke the connection at any time at {PERMISSIONS} or ask us by email to delete it; the stored token will then be deleted. The legal basis is your consent, Art. 6(1)(a) GDPR.</p>

      <h2 style={section}>7. Your rights</h2>
      <p style={p}>You have the right of access, rectification, erasure and restriction of processing of your personal data, as well as the right to object and the right to data portability. To exercise these rights, please contact {MAIL}.</p>
    </>
  );
}

export default async function DatenschutzPage() {
  const isEn = (await getLocale()) === 'en';
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      {isEn ? <English /> : <German />}
    </div>
  );
}
