import Link from 'next/link';

const footerLink = { color: 'rgba(255,255,255,0.7)', textDecoration: 'none' } as const;

export function Footer({ locale = 'de' }: { locale?: 'de' | 'en'; enHome?: string }) {
  const isEn = locale === 'en';
  return (
    <footer style={{ background: 'var(--ink)', color: 'rgba(255,255,255,0.7)', padding: '2.5rem 1.5rem', marginTop: '4rem' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>
          {isEn ? (
            <>search-engines<span style={{ color: 'var(--emerald-light)' }}>.pro</span></>
          ) : (
            <>suchmaschinen<span style={{ color: 'var(--emerald-light)' }}>.pro</span></>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '.82rem', flexWrap: 'wrap' }}>
          {isEn ? (
            <>
              <Link href="/tour" style={footerLink}>Tour</Link>
              <Link href="/contact" style={footerLink}>Contact</Link>
              <Link href="/legal-notice" style={footerLink}>Legal notice</Link>
              <Link href="/privacy" style={footerLink}>Privacy policy</Link>
            </>
          ) : (
            <>
              <Link href="/rundgang" style={footerLink}>Rundgang</Link>
              <Link href="/kontakt" style={footerLink}>Kontakt</Link>
              <Link href="/impressum" style={footerLink}>Impressum</Link>
              <Link href="/datenschutz" style={footerLink}>Datenschutz</Link>
            </>
          )}
        </div>
        <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,0.45)' }}>
          {isEn
            ? <>© {new Date().getFullYear()} search-engines.pro — a service by PAN21.COM Corporate Consultants Ltd</>
            : <>© {new Date().getFullYear()} suchmaschinen.pro — ein Angebot der PAN21.COM Corporate Consultants Ltd</>}
        </div>
      </div>
    </footer>
  );
}
