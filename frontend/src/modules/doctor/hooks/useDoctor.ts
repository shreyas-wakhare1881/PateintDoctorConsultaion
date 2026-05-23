import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi } from '../api/doctor.api';

export const DOCTOR_QUERY_KEYS = {
  profile: ['doctor', 'profile'] as const,
  availability: ['doctor', 'availability'] as const,
  consultations: ['doctor', 'consultations'] as const,
};

export const useDoctorProfile = () =>
  useQuery({
    queryKey: DOCTOR_QUERY_KEYS.profile,
    queryFn: () => doctorApi.getProfile().then((r) => r.data.data),
  });

export const useDoctorAvailability = () =>
  useQuery({
    queryKey: DOCTOR_QUERY_KEYS.availability,
    queryFn: () => doctorApi.getAvailability().then((r) => r.data.data),
  });

export const useUpdateDoctorAvailability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: doctorApi.updateAvailability,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: DOCTOR_QUERY_KEYS.availability }),
  });
};

export const useDoctorConsultations = () =>
  useQuery({
    queryKey: DOCTOR_QUERY_KEYS.consultations,
    queryFn: () => doctorApi.getConsultations().then((r) => r.data.data),
  });
