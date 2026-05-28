import { apiClient, aiApiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';
import type { BookConsultationRequest, ConsultationListQuery } from '../types/consultation.types';

export const consultationApi = {
  book: (data: BookConsultationRequest) =>
    apiClient.post(apiConfig.endpoints.consultations.book, data),

  getMyConsultations: (params?: ConsultationListQuery) =>
    apiClient.get(apiConfig.endpoints.consultations.my, { params }),

  getById: (id: string) =>
    apiClient.get(apiConfig.endpoints.consultations.byId(id)),

  cancel: (id: string, reason: string) =>
    apiClient.put(apiConfig.endpoints.consultations.cancel(id), { reason }),

  getDoctorRequests: (params?: ConsultationListQuery) =>
    apiClient.get(apiConfig.endpoints.consultations.requests, { params }),

  getDoctorSchedule: (params?: { date?: string; page?: number; pageSize?: number }) =>
    apiClient.get('/api/consultations/doctor/schedule', { params }),

  confirm: (id: string) =>
    apiClient.put(apiConfig.endpoints.consultations.confirm(id), {}),

  reject: (id: string, reason: string) =>
    apiClient.put(apiConfig.endpoints.consultations.reject(id), { reason }),

  start: (id: string) =>
    apiClient.put(apiConfig.endpoints.consultations.start(id), {}),

  complete: (id: string, notes?: string) =>
    apiClient.put(apiConfig.endpoints.consultations.complete(id), { notes }),

  getHistory: (id: string) =>
    apiClient.get(apiConfig.endpoints.consultations.history(id)),

  generateVideoToken: (id: string) =>
    apiClient.post(apiConfig.endpoints.consultations.videoToken(id), {}),

  /** Generates AI consultation summary via the FastAPI AI service. */
  generateSummary: (id: string, data: unknown) =>
    aiApiClient.post('/ai/summary/', { consultation_id: id, ...data as object }),
};
