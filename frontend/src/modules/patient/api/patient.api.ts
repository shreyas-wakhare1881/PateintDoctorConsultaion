import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export const patientApi = {
  // GET /api/patients/me — fetch authenticated patient profile
  getProfile: () => apiClient.get(apiConfig.endpoints.patients.me),
  // PUT /api/patients/me — partial update
  updateProfile: (data: unknown) =>
    apiClient.put(apiConfig.endpoints.patients.me, data),
  getDoctors: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.doctors.public, { params }),
  getConsultations: () =>
    apiClient.get(apiConfig.endpoints.consultations.my),
};
