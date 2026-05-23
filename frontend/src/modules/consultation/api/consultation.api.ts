import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export const consultationApi = {
  book: (data: unknown) => apiClient.post(apiConfig.endpoints.consultation.book, data),
  getRoom: (id: string) => apiClient.get(apiConfig.endpoints.consultation.room(id)),
  getSummary: (id: string) => apiClient.get(apiConfig.endpoints.consultation.summary(id)),
  generateSummary: (id: string, data: unknown) =>
    apiClient.post(apiConfig.endpoints.consultation.summary(id), data),
};
