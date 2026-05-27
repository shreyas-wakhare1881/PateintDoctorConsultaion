/**
 * API Error Utilities
 * Source of truth: frontend/SDD/auth.md — Error States
 */

import type { AxiosError } from 'axios';
import type { ApiError, ApiResponse } from '@/types/api.types';

/**
 * Extracts a structured ApiError from an Axios error.
 * Maps backend error codes to user-facing messages.
 */
export const parseApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<ApiResponse>;

  if (!axiosError.response) {
    const code = axiosError.code;

    // Request timed out
    if (code === 'ECONNABORTED') {
      return {
        status: 0,
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
      };
    }

    // Server refused connection — backend is not running or wrong port
    if (code === 'ERR_NETWORK' || code === 'ERR_CONNECTION_REFUSED') {
      return {
        status: 0,
        message: 'Unable to connect to the server. Please try again shortly.',
        code: 'NETWORK_ERROR',
      };
    }

    // Other network failures (offline, DNS, etc.)
    return {
      status: 0,
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
    };
  }

  const { status, data } = axiosError.response;
  const message = data?.message ?? getDefaultMessage(status);

  // Prefer the structured `code` field from the backend response.
  // Fall back to extracting a code from the message string for older
  // endpoints that don't yet return a `code` field.
  const code = data?.code ?? extractErrorCode(data?.message ?? '');

  return {
    status,
    message,
    code,
    errors: data?.errors,
  };
};

/**
 * Returns a user-friendly message for standard HTTP status codes.
 * Matches error state definitions from SDD.
 */
export const getDefaultMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Session expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred. Please refresh and try again.',
    422: 'The request could not be processed.',
    429: 'Too many requests. Please wait a moment.',
    500: 'Server error. Please try again later.',
  };
  return messages[status] ?? 'An unexpected error occurred.';
};

/** Extract backend error codes from response data for specific UI handling.
 *
 * PRIMARY path: backend returns a `code` field directly — this is preferred.
 * FALLBACK path: derive a code by scanning the human message string.
 * This fallback handles older endpoints before the `code` field was added.
 */
const extractErrorCode = (message: string): string | undefined => {
  // Try exact-match known codes first (backend may return these in the message
  // field in some legacy paths).
  const knownCodes = [
    'INVALID_OTP',
    'OTP_EXPIRED',
    'NO_PENDING_OTP',
    'ACCOUNT_INACTIVE',
    'ROLE_NOT_ALLOWED',
    'INVALID_CREDENTIALS',
    'INVALID_REFRESH_TOKEN',
    'REFRESH_TOKEN_EXPIRED',
    'PROFILE_EXISTS',
    'LICENSE_DUPLICATE',
    'APPROVAL_REQUIRED',
    'VALIDATION_ERROR',
    'RATE_LIMIT_EXCEEDED',
  ];
  const exactMatch = knownCodes.find((code) => message.includes(code));
  if (exactMatch) return exactMatch;

  // Natural-language message fallback — map backend prose to a code token.
  // Ordered from most-specific to least-specific to avoid false matches.
  const patterns: Array<[RegExp, string]> = [
    [/invalid otp code/i,                   'INVALID_OTP'],
    [/otp has expired/i,                    'OTP_EXPIRED'],
    [/no pending otp/i,                     'NO_PENDING_OTP'],
    [/account is deactivated/i,             'ACCOUNT_INACTIVE'],
    [/pending admin approval/i,             'ACCOUNT_INACTIVE'],
    [/non-patient account/i,                'ROLE_NOT_ALLOWED'],
    [/invalid credentials/i,                'INVALID_CREDENTIALS'],
    [/invalid or expired refresh token/i,   'INVALID_REFRESH_TOKEN'],
    [/refresh token has expired/i,          'REFRESH_TOKEN_EXPIRED'],
    [/already exists/i,                     'CONFLICT'],
    [/rate.?limit/i,                        'RATE_LIMIT_EXCEEDED'],
  ];

  for (const [pattern, code] of patterns) {
    if (pattern.test(message)) return code;
  }

  return undefined;
};

/** Returns true if the error is a network/timeout failure (no server response). */
export const isNetworkError = (error: ApiError): boolean => error.status === 0;

/** Returns true if the error is an authentication failure. */
export const isUnauthorized = (error: ApiError): boolean => error.status === 401;

/** Returns true if the error is a permission/role failure. */
export const isForbidden = (error: ApiError): boolean => error.status === 403;

/** Returns the first validation error for a field, or null. */
export const getFieldError = (
  errors: Record<string, string[]> | undefined,
  field: string
): string | null => {
  return errors?.[field]?.[0] ?? null;
};
