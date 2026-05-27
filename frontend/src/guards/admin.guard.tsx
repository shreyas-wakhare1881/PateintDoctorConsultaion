'use client';

/**
 * AdminGuard — restricts route to role=Admin only.
 * Source of truth: frontend/SDD/auth.md — Redirect matrix
 * Unauthenticated redirect: /admin/login
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES, ROLE_DASHBOARD } from '@/config/routes';
import { SessionLoader } from '@/components/shared/session-loader';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.admin.login);
      return;
    }
    if (user?.role !== 'Admin') {
      router.replace(ROLE_DASHBOARD[user!.role] ?? ROUTES.login);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (!isAuthenticated || user?.role !== 'Admin') return null;

  return <>{children}</>;
}
