'use client';

/**
 * useRoleRedirect — redirects user to their role-appropriate dashboard.
 * Source of truth: frontend/SDD/auth.md — Redirect matrix
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_DASHBOARD, UNAUTHENTICATED_REDIRECT } from '@/config/routes';

/**
 * Redirects an authenticated user to their dashboard.
 * Use on public/auth pages to prevent authenticated users from seeing login screens.
 */
export function useRoleRedirect() {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;
    if (isAuthenticated && user) {
      const destination = ROLE_DASHBOARD[user.role] ?? UNAUTHENTICATED_REDIRECT;
      router.replace(destination);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  return { isSessionLoading };
}
