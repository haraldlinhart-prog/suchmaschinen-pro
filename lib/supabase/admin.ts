export const ADMIN_EMAIL = 'haraldlinhart@gmail.com';

// Everyone with admin rights on suchmaschinen.pro
// 26.09.26: Martin (Harry's brother) added
// 26.09.26: John (Lighthouse Trust) added — own websites, own Google Search Console
export const ADMIN_EMAILS = [ADMIN_EMAIL, 'info@martin-linhart.de', 'john@lighthouse-trust.com'];

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
