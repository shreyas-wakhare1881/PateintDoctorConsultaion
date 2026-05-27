'use client';

/**
 * useAuth — primary auth hook.
 * Provides auth state + login/logout/register actions.
 * Source of truth: frontend/SDD/auth.md
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Toast notifications are handled at the component level using the ToastProvider.
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { ROUTES, ROLE_DASHBOARD, ROLE_LOGIN } from '@/config/routes';
import { parseApiError } from '@/utils/errors';
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  LoginRequest,
  RegisterRequest,
} from '@/types/auth.types';

export function useAuth() {
  const store = useAuthStore();
  const router = useRouter();

  // ── Patient OTP Flow ───────────────────────────────────────────────────────

  const sendOtp = useCallback(async (data: SendOtpRequest) => {
    const result = await authService.sendOtp(data);
    return result;
  }, []);

  const verifyOtp = useCallback(
    async (data: VerifyOtpRequest) => {
      const result = await authService.verifyOtp(data);
      if (result.success && result.data) {
        const { accessToken, refreshToken, user } = result.data;
        store.login(
          {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isVerified: user.isVerified,
          },
          accessToken,
          refreshToken
        );
      }
      return result;
    },
    [store]
  );

  // ── Doctor / Admin Credential Flow ────────────────────────────────────────

  const login = useCallback(
    async (data: LoginRequest) => {
      const result = await authService.login(data);
      if (result.success && result.data) {
        const { accessToken, refreshToken, user } = result.data;
        store.login(
          {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isVerified: user.isVerified,
          },
          accessToken,
          refreshToken
        );
      }
      return result;
    },
    [store]
  );

  const register = useCallback(async (data: RegisterRequest) => {
    return authService.register(data);
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    const roleBeforeLogout = store.user?.role;
    try {
      // Pass current refreshToken so backend can revoke it.
      // If none (already expired), backend call will fail — we still clear locally.
      await authService.logout(store.refreshToken ?? '');
    } catch {
      // Even if API call fails, clear local session.
    } finally {
      store.logout();
      router.replace(ROLE_LOGIN[roleBeforeLogout ?? 'Patient'] ?? ROUTES.login);
    }
  }, [store, router]);

  // ── Role-based redirect ───────────────────────────────────────────────────

  const redirectToDashboard = useCallback(() => {
    if (!store.user) return;
    router.replace(ROLE_DASHBOARD[store.user.role] ?? ROUTES.login);
  }, [store.user, router]);

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isSessionLoading: store.isSessionLoading,
    role: store.user?.role ?? null,

    // Actions
    sendOtp,
    verifyOtp,
    login,
    register,
    logout,
    redirectToDashboard,
  };
}
