export const ADMIN_EMAIL = 'haraldlinhart@gmail.com';

// Everyone with admin rights on suchmaschinen.pro (chat 26.09.26: Harry's brother Martin added).
export const ADMIN_EMAILS = [ADMIN_EMAIL, 'info@martin-linhart.de'];

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
