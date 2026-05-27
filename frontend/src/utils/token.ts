/**
 * Token Utilities
 * Source of truth: frontend/SDD/auth.md — JWT handling section
 */

import type { JwtPayload } from '@/types/auth.types';

/**
 * Decode a JWT payload without verifying signature.
 * Verification is the backend's responsibility.
 */
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const base64Payload = token.split('.')[1];
    if (!base64Payload) return null;
    const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Returns true if the access token is expired or malformed.
 * Uses a 30-second buffer to proactively refresh before actual expiry.
 */
export const isTokenExpired = (token: string, bufferSeconds = 30): boolean => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowSeconds + bufferSeconds;
};

/** Extract role from JWT without full decode overhead. */
export const getRoleFromToken = (token: string): string | null => {
  return decodeJwt(token)?.role ?? null;
};
