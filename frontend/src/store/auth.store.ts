import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/types/auth.types';
import { queryClient } from '@/lib/query-client';
import { useBookingStore } from './booking.store';
import { useConsultationStore } from './consultation.store';

/**
 * Auth User shape — matches backend JWT claims + /api/auth/me response.
 */
export interface AuthUser {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  isVerified: boolean;
}

interface AuthState {
  /** In-memory only. NEVER persisted. Lost on page reload — intentional. */
  accessToken: string | null;
  /** Persisted to localStorage under key `pdc_rt`. Single-use rotation. */
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True while splash screen is checking session / calling refresh endpoint. */
  isSessionLoading: boolean;
  /**
   * True when the Axios interceptor detects a mid-session 401 after refresh fails.
   * Triggers the SessionExpiredModal. Cleared when modal redirects to /login.
   */
  showSessionExpiredModal: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────
  /** Called after successful login / OTP verify / token refresh. */
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  /** Called on logout — clears ALL state including query cache and transient stores. */
  logout: () => void;
  /** Called after a successful token refresh — updates tokens only. */
  refreshSession: (accessToken: string, refreshToken: string) => void;
  /** Hard-clear without API call (used on refresh failure). */
  clearSession: () => void;
  /** Trigger the session expired modal (called by Axios interceptor). */
  triggerSessionExpired: () => void;
  /** Dismiss the session expired modal (called when user clicks "Login again"). */
  dismissSessionExpired: () => void;
  /** Update user object only (e.g. after profile completion). */
  setUser: (user: AuthUser) => void;
  setSessionLoading: (loading: boolean) => void;
}

// ── Session cookie helpers ────────────────────────────────────────────────────
// A lightweight SameSite=Lax cookie (`pdc_session`) signals to the Next.js
// Edge middleware that the user has an active session, without exposing any
// secret material.  The actual JWT lives in-memory only.

const SESSION_COOKIE = 'pdc_session';
const REFRESH_TTL_DAYS = 7; // matches backend refresh token TTL

const setSessionCookie = (): void => {
  if (typeof document === 'undefined') return;
  const maxAge = REFRESH_TTL_DAYS * 24 * 60 * 60;
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const clearSessionCookie = (): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
};

/**
 * Clears all transient application state on logout.
 * Called from every logout path: explicit logout, session expiry, clearSession.
 *
 * Clears:
 *  - TanStack Query cache (all cached API responses for every role)
 *  - Booking flow state (selected doctor, slot, symptoms)
 *  - Active consultation / call state
 *  - Session cookie (for Edge middleware)
 */
const clearAllAppState = (): void => {
  clearSessionCookie();
  // Clear all cached API responses — prevents stale patient/doctor/admin data
  // leaking into the next user's session on a shared device.
  queryClient.clear();
  // Clear transient UI stores.
  useBookingStore.getState().reset();
  useConsultationStore.getState().endCall();
  // Clear OTP session from sessionStorage so a stale phone/timestamp cannot be
  // replayed on /verify-otp after logout (prevents NO_PENDING_OTP ghost sessions).
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pdc_otp_phone');
    sessionStorage.removeItem('pdc_otp_sent_at');
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isSessionLoading: true,
      showSessionExpiredModal: false,

      login: (user, accessToken, refreshToken) => {
        setSessionCookie();
        set({ user, accessToken, refreshToken, isAuthenticated: true, isSessionLoading: false, showSessionExpiredModal: false });
      },

      logout: () => {
        clearAllAppState();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isSessionLoading: false, showSessionExpiredModal: false });
      },

      /** Called after a successful token refresh — updates tokens and marks session as active. */
      refreshSession: (accessToken, refreshToken) => {
        setSessionCookie();
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      clearSession: () => {
        clearAllAppState();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isSessionLoading: false });
      },

      triggerSessionExpired: () => {
        clearAllAppState();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, showSessionExpiredModal: true });
      },

      dismissSessionExpired: () =>
        set({ showSessionExpiredModal: false }),

      setUser: (user) => set({ user }),

      setSessionLoading: (isSessionLoading) => set({ isSessionLoading }),
    }),
    {
      name: 'pdc_rt',
      // ⚠️ SECURITY: Only persist refreshToken + user. accessToken stays in memory only.
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
