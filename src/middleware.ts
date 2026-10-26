import { type NextRequest, NextResponse } from 'next/server';

/**
 * Convenience redirect middleware for the admin area.
 * NOTE: As per architectural design, middleware is only a convenience UX redirect.
 * The true cryptographic and authorization security boundary is enforced server-side
 * via `requireAdmin()` in `src/lib/auth-guard.ts`.
 */
export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const pathname = nextUrl.pathname;

  // Check for presence of Auth.js / NextAuth v5 session cookies (both standard and secure HTTPS variants)
  const hasSessionCookie =
    cookies.has('authjs.session-token') ||
    cookies.has('__Secure-authjs.session-token') ||
    cookies.has('next-auth.session-token') ||
    cookies.has('__Secure-next-auth.session-token');

  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  // Convenience redirect: send unauthenticated visitors to /admin/login
  if (isAdminRoute && !isLoginPage && !hasSessionCookie) {
    const loginUrl = new URL('/admin/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Convenience redirect: send logged-in admin directly to /admin
  if (isLoginPage && hasSessionCookie) {
    return NextResponse.redirect(new URL('/admin', nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
