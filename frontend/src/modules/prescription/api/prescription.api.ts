import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';
import type { CreatePrescriptionRequest } from '../types/prescription.types';

export const prescriptionApi = {
  create: (consultationId: string, data: CreatePrescriptionRequest) =>
    apiClient.post(apiConfig.endpoints.consultations.prescription(consultationId), data),

  getByConsultation: (consultationId: string) =>
    apiClient.get(apiConfig.endpoints.consultations.prescription(consultationId)),

  getMyPrescriptions: () =>
    apiClient.get(apiConfig.endpoints.prescriptions.my),
};
