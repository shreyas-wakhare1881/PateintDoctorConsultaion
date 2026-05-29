import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { PAGINATION } from '@/config/constants';

export const ADMIN_QUERY_KEYS = {
  dashboard: ['admin', 'dashboard'] as const,
  doctors: (params?: unknown) => ['admin', 'doctors', params] as const,
  pendingDoctors: (page?: number, pageSize?: number) => ['admin', 'doctors', 'pending', page, pageSize] as const,
  patients: (params?: unknown) => ['admin', 'patients', params] as const,
  consultations: (params?: unknown) => ['admin', 'consultations', params] as const,
  consultationById: (id: string) => ['admin', 'consultation', id] as const,
  auditLogs: (params?: unknown) => ['admin', 'audit-logs', params] as const,
};

export const useAdminDashboard = () =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.dashboard,
    queryFn: () => adminApi.getDashboard().then((r) => r.data.data),
  });

export const useAdminDoctors = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.doctors(params),
    queryFn: () => adminApi.getDoctors(params).then((r) => r.data.data),
  });

export const useAdminPendingDoctors = (
  page: number = PAGINATION.DEFAULT_PAGE,
  pageSize: number = PAGINATION.ADMIN_DEFAULT_PAGE_SIZE,
) =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.pendingDoctors(page, pageSize),
    queryFn: () => adminApi.getPendingDoctors({ page, pageSize }).then((r) => r.data.data),
    // Refresh every 30 seconds to pick up newly registered doctors
    refetchInterval: 30_000,
  });

/** Approve a pending doctor. Invalidates both all-doctors and pending-doctors lists. */
export const useApproveDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, reason }: { doctorId: string; reason?: string }) =>
      adminApi.approveDoctor(doctorId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboard });
    },
  });
};

/** Reject a pending doctor. Requires a reason. */
export const useRejectDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, reason }: { doctorId: string; reason: string }) =>
      adminApi.rejectDoctor(doctorId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboard });
    },
  });
};

/** Suspend an approved doctor. Requires a reason. */
export const useSuspendDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, reason }: { doctorId: string; reason: string }) =>
      adminApi.suspendDoctor(doctorId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboard });
    },
  });
};

/** Reactivate a suspended doctor. */
export const useReactivateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, reason }: { doctorId: string; reason?: string }) =>
      adminApi.reactivateDoctor(doctorId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
      qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboard });
    },
  });
};

export const useAdminPatients = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.patients(params),
    queryFn: () => adminApi.getPatients(params).then((r) => r.data.data),
  });

export const useBlockPatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminApi.blockPatient(userId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'patients'] }),
  });
};

export const useUnblockPatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.unblockPatient(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'patients'] }),
  });
};

export const useAdminConsultations = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.consultations(params),
    queryFn: () => adminApi.getConsultations(params).then((r) => r.data.data),
  });

export const useAdminConsultationById = (id: string) =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.consultationById(id),
    queryFn: () => adminApi.getConsultationById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAdminAuditLogs = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.auditLogs(params),
    queryFn: () => adminApi.getAuditLogs(params).then((r) => r.data.data),
  });
