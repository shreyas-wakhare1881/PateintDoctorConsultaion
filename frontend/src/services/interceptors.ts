/**
 * Axios Auth Interceptors
 * Source of truth: frontend/SDD/auth.md §8 Session Lifecycle
 *
 * Token strategy:
 *  - accessToken: in-memory only (Zustand store). Attached to requests.
 *  - refreshToken: persisted (localStorage). Used to rotate tokens on 401.
 *
 * PUBLIC_ENDPOINTS — these MUST NOT trigger the 401 → refresh loop.
 * ────────────────────────────────────────────────────────────────────────────
 * The backend uses HTTP 401 for two distinct situations:
 *   a) Expired/missing JWT on a protected route → session refresh needed
 *   b) Invalid OTP / wrong password on a public route → business logic error
 *
 * Without this guard, a wrong OTP triggers the interceptor which either:
 *   - Consumes the user's refreshToken trying an unnecessary session refresh
 *   - Calls forceLogout() → shows "Session Expired" modal on the OTP page
 * Both are incorrect. Public endpoint 401s must be passed directly to callers.
 *
 * Refresh flow (protected endpoints only):
 *  1. Request gets 401.
 *  2. Attempt POST /api/auth/refresh once with stored refreshToken.
 *  3. On success: update store with new token pair, retry original request.
 *  4. On failure: triggerSessionExpired() → shows modal → user clicks → /login.
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import { apiConfig } from '@/config/api.config';
import { useAuthStore } from '@/store/auth.store';

// ── Public endpoints — [AllowAnonymous] on the backend ───────────────────────
// 401 from any of these is a BUSINESS LOGIC failure (wrong OTP, bad password),
// NOT a session failure. Skip all auth handling and pass the error through.
const PUBLIC_ENDPOINTS: ReadonlySet<string> = new Set([
  apiConfig.endpoints.auth.sendOtp,
  apiConfig.endpoints.auth.verifyOtp,
  apiConfig.endpoints.auth.login,
  apiConfig.endpoints.auth.register,
  apiConfig.endpoints.auth.refresh,
]);

const isPublicEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return [...PUBLIC_ENDPOINTS].some((endpoint) => url.includes(endpoint));
};

// ── Token refresh queue ───────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

/** Trigger the session-expired modal and clear state. No hard redirect. */
const forceLogout = () => {
  useAuthStore.getState().triggerSessionExpired();
};

export const attachAuthInterceptor = (client: AxiosInstance): void => {
  // ── Request: attach accessToken (protected routes only) ──────────────────
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Never inject an Authorization header on public endpoints.
      // A stale/invalid token on an [AllowAnonymous] endpoint causes
      // backend JWT middleware noise and obscures business errors.
      if (isPublicEndpoint(config.url)) {
        return config;
      }

      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // ── Response: handle 401 with refresh flow (protected routes only) ────────
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Only handle 401 errors; any other status passes through immediately.
      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      // ── PUBLIC ENDPOINT GUARD ─────────────────────────────────────────────
      // A 401 from send-otp / verify-otp / login / register / refresh is a
      // business logic error (wrong OTP, bad password, expired OTP).
      // It is NOT a session event. Pass it directly to the calling component
      // so it can display the correct user-facing error message.
      if (isPublicEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      // ── REFRESH ENDPOINT GUARD ────────────────────────────────────────────
      // If the refresh call itself returns 401, the session is unrecoverable.
      if (originalRequest.url?.includes(apiConfig.endpoints.auth.refresh)) {
        forceLogout();
        return Promise.reject(error);
      }

      // ── SESSION REFRESH FLOW ──────────────────────────────────────────────
      const { refreshToken, isAuthenticated } = useAuthStore.getState();

      if (!refreshToken) {
        // Only show the "session expired" modal if the user was authenticated.
        // If isAuthenticated is false, the app is in a guest state and the 401
        // is from a misconfigured or unauthenticated request — don't show modal.
        if (isAuthenticated) {
          forceLogout();
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Another refresh is already in-flight — queue this request.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newAccessToken) => {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use a bare axios instance to avoid interceptor loops.
        const response = await axios.post<{
          success: boolean;
          data: { accessToken: string; refreshToken: string };
        }>(
          `${apiConfig.baseUrl}${apiConfig.endpoints.auth.refresh}`,
          { refreshToken },
          { headers: apiConfig.headers }
        );

        const { accessToken: newAccess, refreshToken: newRefresh } =
          response.data.data;

        useAuthStore.getState().refreshSession(newAccess, newRefresh);
        processQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
};
