'use client';

/**
 * useSession — reads session state only (no actions).
 * Lightweight alternative to useAuth for read-only contexts.
 */

import { useAuthStore } from '@/store/auth.store';

export function useSession() {
  const { user, isAuthenticated, isSessionLoading, accessToken } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isSessionLoading,
    accessToken,
    role: user?.role ?? null,
    isPatient: user?.role === 'Patient',
    isDoctor: user?.role === 'Doctor',
    isAdmin: user?.role === 'Admin',
  };
}
