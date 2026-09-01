export const ADMIN_EMAIL = 'haraldlinhart@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
    return email === ADMIN_EMAIL;
}
