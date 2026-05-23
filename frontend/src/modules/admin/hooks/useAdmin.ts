import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const ADMIN_QUERY_KEYS = {
  dashboard: ['admin', 'dashboard'] as const,
  doctors: (params?: unknown) => ['admin', 'doctors', params] as const,
  consultations: (params?: unknown) => ['admin', 'consultations', params] as const,
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

export const useVerifyDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.verifyDoctor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'doctors'] }),
  });
};
