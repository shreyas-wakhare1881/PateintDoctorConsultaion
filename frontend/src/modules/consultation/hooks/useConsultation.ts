import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { consultationApi } from '../api/consultation.api';
import { useConsultationStore } from '@/store/consultation.store';
import type { PaginatedResponse } from '@/types/api.types';
import type {
  BookConsultationRequest,
  ConsultationDetailsDto,
  ConsultationListQuery,
  ConsultationStatusHistoryDto,
  ConsultationSummaryDto,
  ConsultationVideoTokenDto,
} from '../types/consultation.types';

export const CONSULTATION_QUERY_KEYS = {
  myList: (params?: ConsultationListQuery) => ['consultations', 'my', params] as const,
  doctorRequests: (params?: ConsultationListQuery) => ['consultations', 'doctor', 'requests', params] as const,
  doctorSchedule: (params?: { date?: string; page?: number; pageSize?: number }) => ['consultations', 'doctor', 'schedule', params] as const,
  byId: (id: string) => ['consultations', 'detail', id] as const,
  history: (id: string) => ['consultations', 'history', id] as const,
  videoToken: (id: string) => ['consultations', 'video-token', id] as const,
};

export const useBookConsultation = () =>
{
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BookConsultationRequest) => consultationApi.book(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] });
      qc.invalidateQueries({ queryKey: ['patient', 'consultations'] });
      qc.invalidateQueries({ queryKey: ['doctor', 'consultations'] });
    },
  });
};

export const useMyConsultations = (params?: ConsultationListQuery) =>
  useQuery<PaginatedResponse<ConsultationSummaryDto>>({
    queryKey: CONSULTATION_QUERY_KEYS.myList(params),
    queryFn: () => consultationApi.getMyConsultations(params).then((r) => r.data.data),
  });

export const useDoctorConsultationRequests = (params?: ConsultationListQuery) =>
  useQuery<PaginatedResponse<ConsultationSummaryDto>>({
    queryKey: CONSULTATION_QUERY_KEYS.doctorRequests(params),
    queryFn: () => consultationApi.getDoctorRequests(params).then((r) => r.data.data),
  });

export const useDoctorSchedule = (params?: { date?: string; page?: number; pageSize?: number }) =>
  useQuery<PaginatedResponse<ConsultationSummaryDto>>({
    queryKey: CONSULTATION_QUERY_KEYS.doctorSchedule(params),
    queryFn: () => consultationApi.getDoctorSchedule(params).then((r) => r.data.data),
  });

export const useConsultationById = (id: string) =>
  useQuery<ConsultationDetailsDto>({
    queryKey: CONSULTATION_QUERY_KEYS.byId(id),
    queryFn: () => consultationApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useConsultationHistory = (id: string) =>
  useQuery<ConsultationStatusHistoryDto[]>({
    queryKey: CONSULTATION_QUERY_KEYS.history(id),
    queryFn: () => consultationApi.getHistory(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useConsultationVideoToken = (id: string, enabled = true) =>
  useQuery<ConsultationVideoTokenDto>({
    queryKey: CONSULTATION_QUERY_KEYS.videoToken(id),
    queryFn: () => consultationApi.generateVideoToken(id).then((r) => r.data.data),
    enabled: !!id && enabled,
    staleTime: 60_000,
  });

export const useCancelConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => consultationApi.cancel(id, reason),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['consultations'] });
      qc.invalidateQueries({ queryKey: CONSULTATION_QUERY_KEYS.byId(vars.id) });
      qc.invalidateQueries({ queryKey: CONSULTATION_QUERY_KEYS.history(vars.id) });
      qc.invalidateQueries({ queryKey: ['patient', 'consultations'] });
    },
  });
};

const invalidateDoctorConsultationQueries = (qc: ReturnType<typeof useQueryClient>, id: string) => {
  qc.invalidateQueries({ queryKey: ['consultations'] });
  qc.invalidateQueries({ queryKey: ['doctor', 'consultations'] });
  qc.invalidateQueries({ queryKey: CONSULTATION_QUERY_KEYS.byId(id) });
  qc.invalidateQueries({ queryKey: CONSULTATION_QUERY_KEYS.history(id) });
};

export const useConfirmConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consultationApi.confirm(id),
    onSuccess: (_, id) => invalidateDoctorConsultationQueries(qc, id),
  });
};

export const useRejectConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => consultationApi.reject(id, reason),
    onSuccess: (_, vars) => invalidateDoctorConsultationQueries(qc, vars.id),
  });
};

export const useStartConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consultationApi.start(id),
    onSuccess: (_, id) => invalidateDoctorConsultationQueries(qc, id),
  });
};

export const useCompleteConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => consultationApi.complete(id, notes),
    onSuccess: (_, vars) => invalidateDoctorConsultationQueries(qc, vars.id),
  });
};

export const useConsultationRoom = (id: string) =>
  useConsultationById(id);

export const useGenerateSummary = (id: string) =>
  useMutation({
    mutationFn: (data: unknown) => consultationApi.generateSummary(id, data),
  });

export const useCallControls = () => {
  const { toggleMic, toggleCamera, endCall, isMicMuted, isCameraOff } =
    useConsultationStore();
  return { toggleMic, toggleCamera, endCall, isMicMuted, isCameraOff };
};
