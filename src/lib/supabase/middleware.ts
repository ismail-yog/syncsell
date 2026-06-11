import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routes accessible without authentication */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
];

/** Route prefixes accessible without authentication */
const PUBLIC_PREFIXES = [
  '/api/webhooks/',
  '/api/auth/callback',
  '/api/ebay/auth',
];

/**
 * Checks if a given pathname is a public route.
 *
 * @param pathname - The request pathname to check
 * @returns True if the route is publicly accessible
 */
function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Updates the Supabase auth session by refreshing tokens via cookies.
 * Redirects unauthenticated users to /login on protected routes.
 *
 * @param request - The incoming Next.js request object
 * @returns A NextResponse with updated auth cookies
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not use getSession() here. getUser() sends a request
  // to the Supabase Auth server to revalidate the Auth token, whereas
  // getSession() does not.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users on protected routes to /login
  if (!user && !isPublicRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
