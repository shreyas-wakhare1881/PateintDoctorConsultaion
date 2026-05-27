import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const ADMIN_QUERY_KEYS = {
  dashboard: ['admin', 'dashboard'] as const,
  doctors: (params?: unknown) => ['admin', 'doctors', params] as const,
  pendingDoctors: ['admin', 'doctors', 'pending'] as const,
  patients: (params?: unknown) => ['admin', 'patients', params] as const,
  consultations: (params?: unknown) => ['admin', 'consultations', params] as const,
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

export const useAdminPendingDoctors = () =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.pendingDoctors,
    queryFn: () => adminApi.getPendingDoctors().then((r) => r.data.data),
  });

/** Approve a pending doctor. Invalidates the doctors list on success. */
export const useApproveDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doctorId: string) => adminApi.approveDoctor(doctorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'doctors'] }),
  });
};

/** Reject a pending doctor. Requires a reason. */
export const useRejectDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, reason }: { doctorId: string; reason: string }) =>
      adminApi.rejectDoctor(doctorId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'doctors'] }),
  });
};

/** Suspend an approved doctor. Requires a reason. */
export const useSuspendDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, reason }: { doctorId: string; reason: string }) =>
      adminApi.suspendDoctor(doctorId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'doctors'] }),
  });
};

/** Reactivate a suspended doctor. */
export const useReactivateDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doctorId: string) => adminApi.reactivateDoctor(doctorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'doctors'] }),
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

export const useAdminAuditLogs = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ADMIN_QUERY_KEYS.auditLogs(params),
    queryFn: () => adminApi.getAuditLogs(params).then((r) => r.data.data),
  });
