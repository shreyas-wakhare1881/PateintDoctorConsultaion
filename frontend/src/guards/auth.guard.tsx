'use client';

/**
 * AuthGuard — blocks unauthenticated users from any protected route.
 * Source of truth: frontend/SDD/auth.md §6.1 Authorization Rules
 * Unauthenticated redirect: /login (patient-first v2)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { UNAUTHENTICATED_REDIRECT } from '@/config/routes';
import { SessionLoader } from '@/components/shared/session-loader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.replace(UNAUTHENTICATED_REDIRECT);
    }
  }, [isAuthenticated, isSessionLoading, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (!isAuthenticated || !user) return null;

  return <>{children}</>;
}
