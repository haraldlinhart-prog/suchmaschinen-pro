export const metadata = { title: 'Impressum', robots: { index: false, follow: true } };

export default function ImpressumPage() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginBottom: '2rem' }}>Impressum</h1>

      <h2 style={{ fontSize: '1rem', marginTop: '1.75rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>Angaben gemäß § 5 TMG</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' }}>PAN21.COM Corporate Consultants Ltd</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' }}>61 Bridge Street</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' }}>Kington, Herefordshire HR5 3DJ</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' }}>United Kingdom</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' }}>Company No. 16117708</p>

      <h2 style={{ fontSize: '1rem', marginTop: '1.75rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>Geschäftsführer</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' }}>Harald Linhart</p>

      <h2 style={{ fontSize: '1rem', marginTop: '1.75rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>Kontakt</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' }}>
        E-Mail: <a href="mailto:suchmaschinen@pan21.com" style={{ color: 'var(--emerald)' }}>suchmaschinen@pan21.com</a>
      </p>

      <h2 style={{ fontSize: '1rem', marginTop: '1.75rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '0 0 0.3rem' }}>Harald Linhart, Anschrift wie oben</p>
    </div>
  );
}
