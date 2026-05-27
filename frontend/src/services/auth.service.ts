/**
 * Auth Service
 * Source of truth: frontend/SDD/auth.md + backend/Modules/Auth/SDD/APIs.md
 *
 * Wraps all /api/auth/* endpoints. Does NOT call useAuthStore directly —
 * callers (hooks/providers) are responsible for updating the store.
 */

import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';
import type {
  SendOtpRequest,
  VerifyOtpRequest,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  TokenResponseDto,
  AuthUserDto,
} from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

const { endpoints } = apiConfig;

export const authService = {
  /**
   * Patient only: request a 4-digit OTP to phone number.
   * Backend auto-creates a lightweight Patient account if the number is not found.
   * Dev OTP is always "1234" — see backend OtpService.Generate().
   * POST /api/auth/send-otp
   */
  sendOtp: async (data: SendOtpRequest) => {
    const response = await apiClient.post<
      ApiResponse<{ message: string; expiresAt: string }>
    >(endpoints.auth.sendOtp, data);
    return response.data;
  },

  /**
   * Patient only: verify OTP → receive JWT pair.
   * POST /api/auth/verify-otp
   */
  verifyOtp: async (data: VerifyOtpRequest) => {
    const response = await apiClient.post<ApiResponse<TokenResponseDto>>(
      endpoints.auth.verifyOtp,
      data
    );
    return response.data;
  },

  /**
   * Doctor / Admin: email + password login.
   * POST /api/auth/login
   */
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<ApiResponse<TokenResponseDto>>(
      endpoints.auth.login,
      data
    );
    return response.data;
  },

  /**
   * Doctor registration — creates pending account awaiting admin approval.
   * POST /api/auth/register
   */
  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<ApiResponse<{ userId: string; message: string }>>(
      endpoints.auth.register,
      data
    );
    return response.data;
  },

  /**
   * Rotate refresh token → new JWT pair.
   * Called automatically by Axios interceptor on 401.
   * POST /api/auth/refresh
   */
  refresh: async (data: RefreshTokenRequest) => {
    const response = await apiClient.post<ApiResponse<TokenResponseDto>>(
      endpoints.auth.refresh,
      data
    );
    return response.data;
  },

  /**
   * Revoke refresh token. JWT expires naturally.
   * POST /api/auth/logout — backend requires [FromBody] RefreshTokenRequest.
   * Caller must supply the current refresh token so the backend can revoke it.
   */
  logout: async (refreshToken: string) => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      endpoints.auth.logout,
      { refreshToken }
    );
    return response.data;
  },

  /**
   * Get currently authenticated user from JWT claims.
   * GET /api/auth/me
   */
  getMe: async () => {
    const response = await apiClient.get<ApiResponse<AuthUserDto>>(
      endpoints.auth.me
    );
    return response.data;
  },
};
