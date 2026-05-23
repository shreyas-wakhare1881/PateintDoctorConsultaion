import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '../api/patient.api';

export const PATIENT_QUERY_KEYS = {
  profile: ['patient', 'profile'] as const,
  doctors: (params?: unknown) => ['patient', 'doctors', params] as const,
  consultations: ['patient', 'consultations'] as const,
};

export const usePatientProfile = () =>
  useQuery({
    queryKey: PATIENT_QUERY_KEYS.profile,
    queryFn: () => patientApi.getProfile().then((r) => r.data.data),
  });

export const useUpdatePatientProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patientApi.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENT_QUERY_KEYS.profile }),
  });
};

export const useDoctorList = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: PATIENT_QUERY_KEYS.doctors(params),
    queryFn: () => patientApi.getDoctors(params).then((r) => r.data.data),
  });

export const usePatientConsultations = () =>
  useQuery({
    queryKey: PATIENT_QUERY_KEYS.consultations,
    queryFn: () => patientApi.getConsultations().then((r) => r.data.data),
  });
