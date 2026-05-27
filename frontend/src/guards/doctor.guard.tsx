'use client';

/**
 * DoctorGuard — restricts route to role=Doctor only.
 * Source of truth: frontend/SDD/auth.md §6.1 Redirect matrix
 * Unauthenticated redirect: /login (patient-first v2)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { UNAUTHENTICATED_REDIRECT, ROLE_DASHBOARD } from '@/config/routes';
import { SessionLoader } from '@/components/shared/session-loader';

export function DoctorGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;
    if (!isAuthenticated) {
      router.replace(UNAUTHENTICATED_REDIRECT);
      return;
    }
    if (user?.role !== 'Doctor') {
      router.replace(ROLE_DASHBOARD[user!.role] ?? UNAUTHENTICATED_REDIRECT);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (!isAuthenticated || user?.role !== 'Doctor') return null;

  return <>{children}</>;
}
