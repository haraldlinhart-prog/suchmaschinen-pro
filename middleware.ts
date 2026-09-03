import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// search-engines.pro serves the English homepage at its root — internally rewritten
// to /en while the URL bar keeps showing the domain root (see chat 03.09.26).
const ENGLISH_HOST = 'search-engines.pro';

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isEnglishDomain = host === ENGLISH_HOST || host === `www.${ENGLISH_HOST}`;
  const shouldRewriteToEn = isEnglishDomain && request.nextUrl.pathname === '/';

  const rewriteUrl = shouldRewriteToEn ? request.nextUrl.clone() : null;
  if (rewriteUrl) rewriteUrl.pathname = '/en';

  // Also true for a direct visit to suchmaschinen.pro/en, not just the rewritten case.
  const isEnglishPath = shouldRewriteToEn || request.nextUrl.pathname.startsWith('/en');

  function buildResponse() {
    if (!rewriteUrl && !isEnglishPath) return NextResponse.next({ request });
    // x-locale lets Server Components (layout.tsx) know to render English chrome
    // and metadata — both for the rewritten case and a direct /en visit.
    const headers = new Headers(request.headers);
    headers.set('x-locale', 'en');
    if (rewriteUrl) return NextResponse.rewrite(rewriteUrl, { request: { headers } });
    return NextResponse.next({ request: { headers } });
  }

  let supabaseResponse = buildResponse();

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
