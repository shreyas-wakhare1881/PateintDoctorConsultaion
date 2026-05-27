'use client';

/**
 * PatientGuard — restricts route to role=Patient only.
 * Source of truth: frontend/SDD/auth.md — Redirect matrix
 *
 * Redirect rules:
 *  - Unauthenticated → /login
 *  - Doctor → /doctor/dashboard
 *  - Admin → /admin/dashboard
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { UNAUTHENTICATED_REDIRECT, ROLE_DASHBOARD } from '@/config/routes';
import { SessionLoader } from '@/components/shared/session-loader';

export function PatientGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;
    if (!isAuthenticated) {
      router.replace(UNAUTHENTICATED_REDIRECT);
      return;
    }
    if (user?.role !== 'Patient') {
      router.replace(ROLE_DASHBOARD[user!.role] ?? UNAUTHENTICATED_REDIRECT);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (!isAuthenticated || user?.role !== 'Patient') return null;

  return <>{children}</>;
}
