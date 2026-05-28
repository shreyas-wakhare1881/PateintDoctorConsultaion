import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { prescriptionApi } from '../api/prescription.api';
import type { CreatePrescriptionRequest, PrescriptionDto } from '../types/prescription.types';

export const PRESCRIPTION_QUERY_KEYS = {
  byConsultation: (id: string) => ['prescriptions', 'consultation', id] as const,
  myList: () => ['prescriptions', 'my'] as const,
};

export const usePrescriptionByConsultation = (consultationId: string, enabled = true) =>
  useQuery<PrescriptionDto>({
    queryKey: PRESCRIPTION_QUERY_KEYS.byConsultation(consultationId),
    queryFn: () =>
      prescriptionApi.getByConsultation(consultationId).then((r) => r.data.data),
    enabled: enabled && !!consultationId,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 404 (no prescription yet) or 403
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 403) return false;
      return failureCount < 2;
    },
  });

export const useMyPrescriptions = () =>
  useQuery<PrescriptionDto[]>({
    queryKey: PRESCRIPTION_QUERY_KEYS.myList(),
    queryFn: () => prescriptionApi.getMyPrescriptions().then((r) => r.data.data),
  });

export const useCreatePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      consultationId,
      data,
    }: {
      consultationId: string;
      data: CreatePrescriptionRequest;
    }) => prescriptionApi.create(consultationId, data).then((r) => r.data.data as PrescriptionDto),
    onSuccess: (_result, { consultationId }) => {
      qc.invalidateQueries({ queryKey: PRESCRIPTION_QUERY_KEYS.byConsultation(consultationId) });
      qc.invalidateQueries({ queryKey: PRESCRIPTION_QUERY_KEYS.myList() });
    },
  });
};
