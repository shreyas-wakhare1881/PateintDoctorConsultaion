'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/modules/auth/services/auth.service';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { clearAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && authService.isTokenExpired()) {
      clearAuth();
    }
  }, [isAuthenticated, clearAuth]);

  return <>{children}</>;
}
