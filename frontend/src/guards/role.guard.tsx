'use client';

/**
 * RoleGuard — generic guard accepting an allowedRoles array.
 * Source of truth: frontend/SDD/auth.md — Route Guard System
 *
 * Usage:
 *   <RoleGuard allowedRoles={['Doctor', 'Admin']}>
 *     <SomePage />
 *   </RoleGuard>
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_DASHBOARD, UNAUTHENTICATED_REDIRECT } from '@/config/routes';
import { SessionLoader } from '@/components/shared/session-loader';
import type { UserRole } from '@/types/auth.types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;

    if (!isAuthenticated || !user) {
      router.replace(UNAUTHENTICATED_REDIRECT);
      return;
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      // Redirect to the user's own dashboard, not a forbidden page.
      const fallback = ROLE_DASHBOARD[user.role] ?? UNAUTHENTICATED_REDIRECT;
      router.replace(fallback);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isSessionLoading, user]);

  if (isSessionLoading) return <SessionLoader />;
  if (!isAuthenticated || !user) return null;
  if (!allowedRoles.includes(user.role as UserRole)) return null;

  return <>{children}</>;
}
