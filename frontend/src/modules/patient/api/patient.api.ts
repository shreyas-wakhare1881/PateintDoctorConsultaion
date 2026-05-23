import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export const patientApi = {
  getProfile: () => apiClient.get(apiConfig.endpoints.patient.profile),
  updateProfile: (data: unknown) =>
    apiClient.put(apiConfig.endpoints.patient.profile, data),
  getDoctors: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.patient.doctors, { params }),
  getConsultations: () =>
    apiClient.get(apiConfig.endpoints.patient.consultations),
};
