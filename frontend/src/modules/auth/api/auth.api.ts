import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export interface LoginPayload {
  email: string;
  password: string;
  role: string;
}

export interface SendOtpPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post(apiConfig.endpoints.auth.login, data),

  sendOtp: (data: SendOtpPayload) =>
    apiClient.post(apiConfig.endpoints.auth.sendOtp, data),

  verifyOtp: (data: VerifyOtpPayload) =>
    apiClient.post(apiConfig.endpoints.auth.verifyOtp, data),

  logout: () =>
    apiClient.post(apiConfig.endpoints.auth.logout),
};
