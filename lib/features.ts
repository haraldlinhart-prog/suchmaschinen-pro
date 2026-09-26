// Until Google has verified the OAuth app, customers would see an "unverified app"
// warning on the Google login — so the GA feature stays admin-only until Google has
// approved the app and NEXT_PUBLIC_GA_FOR_CUSTOMERS=1 is set in Vercel (chat 26.09.26).
export const GA_FOR_CUSTOMERS = process.env.NEXT_PUBLIC_GA_FOR_CUSTOMERS === '1';
