import { apiClient, aiApiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export const consultationApi = {
  book: (data: unknown) =>
    apiClient.post(apiConfig.endpoints.consultations.book, data),

  /** Returns full consultation detail including meetingRoomId for LiveKit. */
  getRoom: (id: string) =>
    apiClient.get(apiConfig.endpoints.consultations.byId(id)),

  /** Generates AI consultation summary via the FastAPI AI service. */
  generateSummary: (id: string, data: unknown) =>
    aiApiClient.post('/ai/summary/', { consultation_id: id, ...data as object }),
};
