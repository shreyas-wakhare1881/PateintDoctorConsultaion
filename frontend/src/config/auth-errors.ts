/**
 * AUTH_ERRORS — Centralized user-facing auth error messages.
 *
 * WHY: Error strings were duplicated across login/OTP/register pages.
 * This creates inconsistency and makes tone changes require hunting 5 files.
 *
 * Healthcare tone: calm, non-technical, actionable.
 * No jargon. No blame. Always offer a next step.
 */

export const AUTH_ERRORS = {
  // OTP flow
  INVALID_OTP:
    'Incorrect OTP. Please check the code and try again.',
  INVALID_OTP_REPEATED:
    'Incorrect OTP again. Request a new code using the link below.',
  OTP_EXPIRED:
    'This OTP has expired. Please request a new one.',
  NO_PENDING_OTP:
    'No OTP was found. Please go back and request a new one.',

  // Account state
  ACCOUNT_INACTIVE:
    'Your account has been deactivated. Please contact our support team.',
  ROLE_NOT_ALLOWED:
    'This mobile number is linked to a Doctor account. Please use Doctor login.',
  ROLE_MISMATCH:
    'This email is not registered for this role. Please check and try again.',

  // Credential login
  INVALID_CREDENTIALS:
    'Incorrect email or password. Please try again.',
  INVALID_CREDENTIALS_REPEATED:
    'Multiple failed attempts. Please reset your password or contact support.',

  // Registration
  EMAIL_EXISTS:
    'An account with this email already exists. Try signing in instead.',
  PHONE_EXISTS:
    'This mobile number is already registered. Try signing in instead.',

  // Session / token
  INVALID_REFRESH_TOKEN:
    'Your session could not be restored. Please log in again.',
  REFRESH_TOKEN_EXPIRED:
    'Your session has expired. Please log in again to continue.',
  SESSION_EXPIRED:
    'Your session has expired. Please log in again to continue.',

  // Network / system
  NETWORK_ERROR:
    'Unable to connect to the server. Please check your connection and try again.',
  TIMEOUT:
    'The request timed out. Please try again.',
  RATE_LIMITED:
    'Too many attempts. Please wait a moment before trying again.',
  SERVER_ERROR:
    'Something went wrong on our end. Please try again shortly.',

  // Generic fallback
  GENERIC:
    'Something went wrong. Please try again.',
} as const;

export type AuthErrorKey = keyof typeof AUTH_ERRORS;

/**
 * Maps a backend error code to a user-facing message.
 * Falls back to the raw message or GENERIC if no match.
 */
export function getAuthError(
  code: string | undefined,
  fallback?: string,
  attempt = 1
): string {
  if (!code) return fallback ?? AUTH_ERRORS.GENERIC;

  const repeated = attempt >= 2;

  const map: Record<string, string> = {
    INVALID_OTP: repeated ? AUTH_ERRORS.INVALID_OTP_REPEATED : AUTH_ERRORS.INVALID_OTP,
    OTP_EXPIRED: AUTH_ERRORS.OTP_EXPIRED,
    NO_PENDING_OTP: AUTH_ERRORS.NO_PENDING_OTP,
    ACCOUNT_INACTIVE: AUTH_ERRORS.ACCOUNT_INACTIVE,
    ROLE_NOT_ALLOWED: AUTH_ERRORS.ROLE_NOT_ALLOWED,
    INVALID_CREDENTIALS: repeated
      ? AUTH_ERRORS.INVALID_CREDENTIALS_REPEATED
      : AUTH_ERRORS.INVALID_CREDENTIALS,
    INVALID_REFRESH_TOKEN: AUTH_ERRORS.INVALID_REFRESH_TOKEN,
    REFRESH_TOKEN_EXPIRED: AUTH_ERRORS.REFRESH_TOKEN_EXPIRED,
    EMAIL_ALREADY_EXISTS: AUTH_ERRORS.EMAIL_EXISTS,
    PHONE_ALREADY_EXISTS: AUTH_ERRORS.PHONE_EXISTS,
    RATE_LIMIT_EXCEEDED: AUTH_ERRORS.RATE_LIMITED,
    CONFLICT: AUTH_ERRORS.GENERIC,
    NETWORK_ERROR: AUTH_ERRORS.NETWORK_ERROR,
    TIMEOUT: AUTH_ERRORS.TIMEOUT,
  };

  return map[code] ?? fallback ?? AUTH_ERRORS.GENERIC;
}
