import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { EN_ORIGIN, EN_SLUG_TO_INTERNAL, EN_HOST_REDIRECTS, ENGLISH_HOSTS, GERMAN_HOSTS } from '@/lib/sitePages'

// search-engines.pro is the English site, suchmaschinen.pro the German one — both served
// by this project. On search-engines.pro the English pages live under English slugs
// (/, /tour, /contact, /legal-notice, /privacy) that are internally rewritten to the
// shared page files; x-locale tells Server Components to render English.
// Areas that only exist in German (dashboard, help pages, hosted articles) stay German.
const GERMAN_ONLY = ['/dashboard', '/hilfe', '/b', '/api'];

function isGermanOnly(path: string): boolean {
  return GERMAN_ONLY.some(p => path === p || path.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  const path = request.nextUrl.pathname.replace(/\/+$/, '') || '/';
  const isEnglishDomain = ENGLISH_HOSTS.includes(host);
  const isGermanDomain = GERMAN_HOSTS.includes(host);

  // One URL per page: German/internal names on the English domain redirect to the English slug …
  if (isEnglishDomain && EN_HOST_REDIRECTS[path]) {
    const url = request.nextUrl.clone();
    url.pathname = EN_HOST_REDIRECTS[path];
    return NextResponse.redirect(url, 301);
  }
  // … and English pages requested on the German domain move to search-engines.pro.
  if (isGermanDomain && (path === '/en' || path.startsWith('/en/') || EN_SLUG_TO_INTERNAL[path])) {
    const target = EN_HOST_REDIRECTS[path] ?? path;
    return NextResponse.redirect(`${EN_ORIGIN}${target}${request.nextUrl.search}`, 301);
  }

  let rewritePath: string | null = null;
  if (isEnglishDomain && path === '/') rewritePath = '/en';
  else if (EN_SLUG_TO_INTERNAL[path]) rewritePath = EN_SLUG_TO_INTERNAL[path];

  const isEnglish = rewritePath !== null
    || path === '/en' || path.startsWith('/en/')
    || (isEnglishDomain && !isGermanOnly(path));

  const rewriteUrl = rewritePath ? request.nextUrl.clone() : null;
  if (rewriteUrl && rewritePath) rewriteUrl.pathname = rewritePath;

  function buildResponse() {
    if (!rewriteUrl && !isEnglish) return NextResponse.next({ request });
    const headers = new Headers(request.headers);
    if (isEnglish) headers.set('x-locale', 'en');
    if (rewriteUrl) return NextResponse.rewrite(rewriteUrl, { request: { headers } });
    return NextResponse.next({ request: { headers } });
  }

  let supabaseResponse = buildResponse();

  // Preview deployments have no Supabase env vars — still serve the public pages there.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return supabaseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = buildResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the session on every request keeps it valid for
  // Server Components, which cannot write cookies themselves.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
