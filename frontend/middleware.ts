/**
 * Next.js Edge Middleware — server-side route protection.
 *
 * Strategy:
 *  The auth store writes a `pdc_session=1` cookie on every login / token
 *  refresh and clears it on logout / session expiry. This cookie is the only
 *  signal available to Edge middleware (localStorage is not accessible here).
 *
 *  The client-side route guards (AuthGuard, PatientGuard, DoctorGuard, AdminGuard)
 *  remain in place as a second layer — they handle role-based redirection which
 *  this middleware cannot do without decoding the JWT.
 *
 * What this middleware does:
 *  1. Passes public routes through unconditionally.
 *  2. Redirects unauthenticated requests to /login for all protected paths.
 *  3. Redirects already-authenticated users away from auth pages to /role
 *     (the role-aware redirect page), preventing duplicate auth entry.
 *
 * What this middleware does NOT do:
 *  - Role enforcement (handled by client guards).
 *  - JWT validation (no crypto on Edge without additional setup).
 */

import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'pdc_session';

// ── Public routes — no auth required ────────────────────────────────────────
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/verify-otp',
  '/doctor',
  '/doctor/login',
  '/doctor/register',
  '/admin/login',
  // Legacy alias pages (they redirect internally)
  '/otp-verification',
  '/patient-login',
  '/doctor-login',
  '/admin-login',
  '/patient/otp',
  '/patient/login',
  '/register',
  '/role',
];

// ── Protected path prefixes — require `pdc_session` cookie ───────────────────
const PROTECTED_PREFIXES = [
  '/patient/',
  '/patient/dashboard',
  '/patient/profile',
  '/patient/doctors',
  '/patient/consultation-history',
  '/patient/book',
  '/patient/setup',
  '/doctor/dashboard',
  '/doctor/profile',
  '/doctor/availability',
  '/doctor/consultations',
  '/doctor/pending',
  '/doctor/rejected',
  '/doctor/suspended',
  '/doctor/setup',
  '/admin/dashboard',
  '/admin/doctors',
  '/admin/patients',
  '/admin/consultations',
  '/admin/audit-logs',
  '/consultation/',
];

// ── Auth pages — redirect to /role if already authenticated ─────────────────
const AUTH_PAGES = [
  '/login',
  '/verify-otp',
  '/doctor/login',
  '/doctor/register',
  '/admin/login',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get(SESSION_COOKIE)?.value === '1';

  // ── 1. Static assets, API routes, Next internals — always pass through ─────
  // (already excluded by the `matcher` below, but guard here for safety)

  // ── 2. Protected route without session → redirect to /login ─────────────────
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the intended destination for post-login redirect (optional enhancement).
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 3. Auth page while already authenticated → redirect to /role ────────────
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/role', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets (icons, images, avatars, manifest)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icons|images|avatars|manifest\\.json).*)',
  ],
};
