/**
 * DoctorGuard — restricts route to role=Doctor only.
 * Source of truth: frontend/SDD/auth.md §6.1 Redirect matrix
 * Unauthenticated redirect: /doctor/login
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES, ROLE_DASHBOARD } from '@/config/routes';
import { SessionLoader } from '@/components/shared/session-loader';

export function DoctorGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.doctor.login);
      return;
    }
    if (user?.role !== 'Doctor') {
      router.replace(ROLE_DASHBOARD[user!.role] ?? ROUTES.login);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (!isAuthenticated || user?.role !== 'Doctor') return null;

  return <>{children}</>;
}
