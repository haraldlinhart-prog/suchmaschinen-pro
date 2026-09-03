'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function Header({ locale = 'de' }: { locale?: 'de' | 'en' }) {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  const isEn = locale === 'en';
  const brandHref = isEn ? '/en' : '/';
  const brandLabel = isEn ? (
    <>search-engines<span style={{ color: 'var(--emerald)' }}>.pro</span></>
  ) : (
    <>suchmaschinen<span style={{ color: 'var(--emerald)' }}>.pro</span></>
  );

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--white)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={brandHref} style={{ textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)' }}>
          {brandLabel}
        </Link>
        <nav style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
          {isEn ? (
            <>
              <Link href="/en#how-it-works" style={{ fontSize: '.88rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }} className="nav-link-desktop">How it works</Link>
              <Link href="/en#pricing" style={{ fontSize: '.88rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }} className="nav-link-desktop">Pricing</Link>
              <Link href="/kontakt" style={{ fontSize: '.88rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }} className="nav-link-desktop">Contact</Link>
              <Link href={loggedIn ? '/dashboard' : '/auth'} className="btn-emerald" style={{ padding: '.55rem 1.2rem', fontSize: '.85rem' }}>
                {loggedIn ? 'Dashboard' : 'Sign in'}
              </Link>
            </>
          ) : (
            <>
              <Link href="/#so-funktionierts" style={{ fontSize: '.88rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }} className="nav-link-desktop">So funktioniert&apos;s</Link>
              <Link href="/#preise" style={{ fontSize: '.88rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }} className="nav-link-desktop">Preise</Link>
              <Link href="/kontakt" style={{ fontSize: '.88rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }} className="nav-link-desktop">Kontakt</Link>
              <Link href={loggedIn ? '/dashboard' : '/auth'} className="btn-emerald" style={{ padding: '.55rem 1.2rem', fontSize: '.85rem' }}>
                {loggedIn ? 'Zum Dashboard' : 'Anmelden'}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
