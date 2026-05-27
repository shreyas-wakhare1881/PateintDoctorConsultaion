'use client';

/**
 * Root page — Splash Screen
 * Source of truth: frontend/SDD/auth.md — Splash Screen behavior
 *
 * This page acts as the splash screen entry point:
 *  - AuthProvider has already attempted token refresh (isSessionLoading → false).
 *  - If authenticated: redirect to role dashboard.
 *  - If not authenticated: redirect to /auth/role.
 *  - Displays SessionLoader while session check is in-flight.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_DASHBOARD, UNAUTHENTICATED_REDIRECT } from '@/config/routes';
import { SessionLoader } from '@/components/shared/session-loader';

export default function SplashPage() {
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isSessionLoading) return;

    if (isAuthenticated && user) {
      const destination = ROLE_DASHBOARD[user.role] ?? UNAUTHENTICATED_REDIRECT;
      router.replace(destination);
    } else {
      router.replace(UNAUTHENTICATED_REDIRECT);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  // Show brand splash while session check + redirect is pending.
  return <SessionLoader />;
}

