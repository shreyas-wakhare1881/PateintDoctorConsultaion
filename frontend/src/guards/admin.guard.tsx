'use client';

/**
 * AdminGuard — restricts route to role=Admin only.
 * Source of truth: frontend/SDD/auth.md — Redirect matrix
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { UNAUTHENTICATED_REDIRECT, ROLE_DASHBOARD } from '@/config/routes';
import { SessionLoader } from '@/components/shared/session-loader';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;
    if (!isAuthenticated) {
      router.replace(UNAUTHENTICATED_REDIRECT);
      return;
    }
    if (user?.role !== 'Admin') {
      router.replace(ROLE_DASHBOARD[user!.role] ?? UNAUTHENTICATED_REDIRECT);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (!isAuthenticated || user?.role !== 'Admin') return null;

  return <>{children}</>;
}
