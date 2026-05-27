/**
 * useAuthAnalytics — Analytics-ready event hooks for the auth system.
 * Source of truth: frontend/SDD/auth.md §10 Analytics Foundation
 *
 * No external provider required. When an analytics provider is integrated
 * (PostHog, Amplitude, Segment, etc.), replace the console.debug calls
 * with the appropriate provider's track() calls.
 *
 * Usage:
 *   const analytics = useAuthAnalytics();
 *   analytics.loginSuccess('otp', user.id);
 */

type AuthMethod = 'otp' | 'credential';

interface AuthAnalytics {
  /** Patient successfully authenticated. */
  loginSuccess: (method: AuthMethod, userId: string) => void;
  /** Login attempt failed before server. */
  loginFailed: (method: AuthMethod, reason: string) => void;
  /** OTP requested for a phone number. */
  otpRequested: (phone: string) => void;
  /** OTP verification failed. */
  otpVerifyFailed: (reason: string, attempt: number) => void;
  /** OTP resend triggered. */
  otpResent: (phone: string) => void;
  /** Doctor started registration form. */
  doctorRegistrationStarted: () => void;
  /** Doctor registration submitted. */
  doctorRegistrationSubmitted: (email: string) => void;
  /** Doctor registration failed. */
  doctorRegistrationFailed: (reason: string) => void;
  /** Refresh token failed — session expired. */
  sessionExpired: (userId?: string) => void;
  /** User voluntarily logged out. */
  userLoggedOut: (userId: string, role: string) => void;
}

export function useAuthAnalytics(): AuthAnalytics {
  const track = (event: string, properties?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[AuthAnalytics]', event, properties ?? '');
    }
    // TODO: Replace with real analytics provider:
    // analytics.track(event, properties);
    // posthog.capture(event, properties);
  };

  return {
    loginSuccess: (method, userId) =>
      track('auth:login_success', { method, userId }),

    loginFailed: (method, reason) =>
      track('auth:login_failed', { method, reason }),

    otpRequested: (phone) =>
      track('auth:otp_requested', { phoneMasked: phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4) }),

    otpVerifyFailed: (reason, attempt) =>
      track('auth:otp_verify_failed', { reason, attempt }),

    otpResent: (phone) =>
      track('auth:otp_resent', { phoneMasked: phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4) }),

    doctorRegistrationStarted: () =>
      track('auth:doctor_registration_started'),

    doctorRegistrationSubmitted: (email) =>
      track('auth:doctor_registration_submitted', { emailDomain: email.split('@')[1] }),

    doctorRegistrationFailed: (reason) =>
      track('auth:doctor_registration_failed', { reason }),

    sessionExpired: (userId) =>
      track('auth:session_expired', { userId }),

    userLoggedOut: (userId, role) =>
      track('auth:logout', { userId, role }),
  };
}
