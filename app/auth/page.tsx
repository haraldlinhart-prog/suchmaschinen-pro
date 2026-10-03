import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { getLocale, englishHomeHref, pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return (await getLocale()) === 'en'
    ? pageMetadata('auth', 'en', { title: 'Sign in or register', description: 'Sign in to search-engines.pro or create a free account.' })
    : pageMetadata('auth', 'de', { title: 'Anmelden oder registrieren', description: 'Bei suchmaschinen.pro anmelden oder kostenlos ein Konto erstellen.' });
}

export default async function AuthPage() {
  const locale = await getLocale();
  const homeHref = locale === 'en' ? await englishHomeHref() : '/';
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}>{locale === 'en' ? 'Loading…' : 'Lädt …'}</div>}>
      <AuthForm locale={locale} homeHref={homeHref} />
    </Suspense>
  );
}
