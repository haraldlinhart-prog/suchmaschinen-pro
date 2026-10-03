'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { absoluteUrl, pageKeyFromPath } from '@/lib/sitePages';

const navLink = { fontSize: '.88rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 } as const;
const langLink = { fontSize: '.8rem', fontWeight: 700, color: 'var(--ink)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '.3rem .55rem', letterSpacing: '.03em' } as const;

export function Header({ locale = 'de', enHome = '/en' }: { locale?: 'de' | 'en'; enHome?: string }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname() || '/';

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  const isEn = locale === 'en';
  // The language switch leads to the same page in the other language (homepage as fallback).
  const pageKey = pageKeyFromPath(pathname) ?? 'home';
  const otherLangHref = absoluteUrl(pageKey, isEn ? 'de' : 'en');
  const pricingHref = `${enHome === '/' ? '/' : enHome}#pricing`;

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--white)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="site-header-inner" style={{ maxWidth: 1120, margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem' }}>
        <Link href={isEn ? enHome : '/'} className="site-brand" style={{ textDecoration: 'none', fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
          {isEn
            ? <>search-engines<span style={{ color: 'var(--emerald)' }}>.pro</span></>
            : <>suchmaschinen<span style={{ color: 'var(--emerald)' }}>.pro</span></>}
        </Link>
        <nav className="site-nav" style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
          {isEn ? (
            <>
              <Link href="/tour" style={navLink} className="nav-link-desktop">Tour</Link>
              <Link href={pricingHref} style={navLink} className="nav-link-desktop">Pricing</Link>
              <Link href="/contact" style={navLink} className="nav-link-desktop">Contact</Link>
              <a href={otherLangHref} hrefLang="de" lang="de" title="Deutsche Version: suchmaschinen.pro" style={langLink}>DE</a>
              <Link href={loggedIn ? '/dashboard' : '/auth'} className="btn-emerald" style={{ padding: '.55rem 1.2rem', fontSize: '.85rem', whiteSpace: 'nowrap' }}>
                {loggedIn ? 'Dashboard' : 'Sign in'}
              </Link>
            </>
          ) : (
            <>
              <Link href="/rundgang" style={navLink} className="nav-link-desktop">Rundgang</Link>
              <Link href="/#preise" style={navLink} className="nav-link-desktop">Preise</Link>
              <Link href="/kontakt" style={navLink} className="nav-link-desktop">Kontakt</Link>
              <a href={otherLangHref} hrefLang="en" lang="en" title="English version: search-engines.pro" style={langLink}>EN</a>
              <Link href={loggedIn ? '/dashboard' : '/auth'} className="btn-emerald" style={{ padding: '.55rem 1.2rem', fontSize: '.85rem', whiteSpace: 'nowrap' }}>
                {loggedIn ? 'Zum Dashboard' : 'Anmelden'}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
