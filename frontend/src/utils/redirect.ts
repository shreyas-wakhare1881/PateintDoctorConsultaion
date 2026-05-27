/**
 * Redirect Utilities
 * Source of truth: frontend/SDD/auth.md — Redirect matrix
 */

import { ROUTES, ROLE_DASHBOARD, UNAUTHENTICATED_REDIRECT } from '@/config/routes';
import type { UserRole } from '@/types/auth.types';

/** Get the dashboard route for a given role. */
export const getDashboardRoute = (role: UserRole): string => {
  return ROLE_DASHBOARD[role] ?? UNAUTHENTICATED_REDIRECT;
};

/** Get the redirect destination for an unauthenticated user. */
export const getUnauthenticatedRedirect = (): string => {
  return UNAUTHENTICATED_REDIRECT;
};

/** Build a return-URL query param for post-login redirect. */
export const withReturnUrl = (route: string, returnUrl: string): string => {
  const encoded = encodeURIComponent(returnUrl);
  return `${route}?returnUrl=${encoded}`;
};

/** Parse returnUrl from query string safely. */
export const getReturnUrl = (searchParams: URLSearchParams): string | null => {
  const raw = searchParams.get('returnUrl');
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    // Safety: only allow relative paths to prevent open redirect attacks.
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded;
    return null;
  } catch {
    return null;
  }
};

export { ROUTES };
