'use client';

/**
 * AuthProvider — Splash session initialization + session expiry modal.
 * Source of truth: frontend/SDD/auth.md §8 Session Lifecycle
 *
 * On mount:
 *  1. Read refreshToken from Zustand (persisted store).
 *  2. If found → POST /api/auth/refresh → update store.
 *  3. If not found / refresh fails → clearSession() (no modal on startup).
 *
 * SessionExpiredModal is rendered here so it's always available globally.
 * Triggered by triggerSessionExpired() in the Axios interceptor.
 */

import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { apiConfig } from '@/config/api.config';
import { SessionExpiredModal } from '@/components/auth/session-expired-modal';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { refreshToken, refreshSession, clearSession, setSessionLoading,
          showSessionExpiredModal, dismissSessionExpired } = useAuthStore();

  useEffect(() => {
    const initializeSession = async () => {
      if (!refreshToken) {
        setSessionLoading(false);
        return;
      }

      try {
        const response = await axios.post<{
          success: boolean;
          data: { accessToken: string; refreshToken: string };
        }>(
          `${apiConfig.baseUrl}${apiConfig.endpoints.auth.refresh}`,
          { refreshToken },
          { headers: apiConfig.headers, timeout: apiConfig.timeout }
        );

        if (response.data.success && response.data.data) {
          const { accessToken, refreshToken: newRefresh } = response.data.data;
          refreshSession(accessToken, newRefresh);
        } else {
          clearSession();
        }
      } catch {
        // Startup refresh failure → clearSession (no modal — user just wasn't signed in)
        clearSession();
      } finally {
        setSessionLoading(false);
      }
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {children}
      {/* Global session expiry modal — triggered by Axios interceptor on mid-session 401 */}
      <SessionExpiredModal
        open={showSessionExpiredModal}
        onClose={dismissSessionExpired}
      />
    </>
  );
}

