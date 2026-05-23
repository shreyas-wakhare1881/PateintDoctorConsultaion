import { env } from './env';

export const apiConfig = {
  baseUrl: env.apiBaseUrl,
  aiServiceUrl: env.aiServiceUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  endpoints: {
    auth: {
      login: '/api/auth/login',
      sendOtp: '/api/auth/send-otp',
      verifyOtp: '/api/auth/verify-otp',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
    },
    patient: {
      profile: '/api/patient/profile',
      doctors: '/api/patient/doctors',
      consultations: '/api/patient/consultations',
    },
    doctor: {
      profile: '/api/doctor/profile',
      availability: '/api/doctor/availability',
      consultations: '/api/doctor/consultations',
    },
    admin: {
      dashboard: '/api/admin/dashboard',
      doctors: '/api/admin/doctors',
      consultations: '/api/admin/consultations',
    },
    consultation: {
      book: '/api/consultation',
      room: (id: string) => `/api/consultation/${id}/room`,
      summary: (id: string) => `/api/consultation/${id}/summary`,
    },
  },
} as const;
