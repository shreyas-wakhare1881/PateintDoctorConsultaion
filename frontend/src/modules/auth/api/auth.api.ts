/**
 * Auth Module API
 * Raw API calls for the auth module, using canonical types from auth.types.ts.
 * Application-level logic lives in src/services/auth.service.ts.
 */

import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
} from '@/types/auth.types';

export const authApi = {
  /** POST /api/auth/send-otp — patient phone-number OTP flow */
  sendOtp: (data: SendOtpRequest) =>
    apiClient.post(apiConfig.endpoints.auth.sendOtp, data),

  /** POST /api/auth/verify-otp — submit OTP, receive token pair */
  verifyOtp: (data: VerifyOtpRequest) =>
    apiClient.post(apiConfig.endpoints.auth.verifyOtp, data),

  /** POST /api/auth/login — email+password for Doctor / Admin */
  login: (data: LoginRequest) =>
    apiClient.post(apiConfig.endpoints.auth.login, data),

  /** POST /api/auth/register — create pending Doctor account */
  register: (data: RegisterRequest) =>
    apiClient.post(apiConfig.endpoints.auth.register, data),

  /** POST /api/auth/refresh — rotate refresh token */
  refresh: (data: RefreshTokenRequest) =>
    apiClient.post(apiConfig.endpoints.auth.refresh, data),

  /** POST /api/auth/logout — revoke refresh token (requires Bearer JWT) */
  logout: (data: RefreshTokenRequest) =>
    apiClient.post(apiConfig.endpoints.auth.logout, data),

  /** GET /api/auth/me — current user from JWT claims (requires Bearer JWT) */
  me: () => apiClient.get(apiConfig.endpoints.auth.me),
};
