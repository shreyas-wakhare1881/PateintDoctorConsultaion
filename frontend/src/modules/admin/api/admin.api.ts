import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export const adminApi = {
  getDashboard: () => apiClient.get(apiConfig.endpoints.admin.dashboard),
  getDoctors: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.admin.doctors, { params }),
  verifyDoctor: (data: unknown) =>
    apiClient.post(`${apiConfig.endpoints.admin.doctors}/verify`, data),
  getConsultations: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.admin.consultations, { params }),
};
