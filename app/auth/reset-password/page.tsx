import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
import { getLocale, englishHomeHref } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const isEn = (await getLocale()) === 'en';
  return { title: isEn ? 'Set a new password' : 'Neues Passwort festlegen', robots: { index: false, follow: false } };
}

export default async function ResetPasswordPage() {
  const locale = await getLocale();
  const homeHref = locale === 'en' ? await englishHomeHref() : '/';
  return <ResetPasswordForm locale={locale} homeHref={homeHref} />;
}
