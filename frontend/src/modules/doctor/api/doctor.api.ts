import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export const doctorApi = {
  getProfile: () => apiClient.get(apiConfig.endpoints.doctor.profile),
  updateProfile: (data: unknown) =>
    apiClient.put(apiConfig.endpoints.doctor.profile, data),
  getAvailability: () => apiClient.get(apiConfig.endpoints.doctor.availability),
  updateAvailability: (data: unknown) =>
    apiClient.put(apiConfig.endpoints.doctor.availability, data),
  getConsultations: () =>
    apiClient.get(apiConfig.endpoints.doctor.consultations),
};
