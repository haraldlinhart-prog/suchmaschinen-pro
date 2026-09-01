import { ContactForm } from '@/components/ContactForm';

export const metadata = { title: 'Kontakt' };

export default function KontaktPage() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="section-label">Kontakt</div>
        <div className="divider-emerald" style={{ margin: '0.75rem auto' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)' }}>Sprechen Sie mit uns</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
          Fragen zum Konzept oder zur Beta-Phase? Schreiben Sie uns.
        </p>
      </div>
      <ContactForm />
    </div>
  );
}
