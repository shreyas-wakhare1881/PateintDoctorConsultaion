import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi } from '../api/doctor.api';

export const DOCTOR_QUERY_KEYS = {
  profile: ['doctor', 'profile'] as const,
  availability: ['doctor', 'availability'] as const,
  consultationRequests: ['doctor', 'consultations', 'requests'] as const,
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

/** Add a new availability slot. */
export const useAddAvailabilitySlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => doctorApi.addAvailabilitySlot(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: DOCTOR_QUERY_KEYS.availability }),
  });
};

/** Update an existing availability slot by its ID. */
export const useUpdateAvailabilitySlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, data }: { slotId: string; data: unknown }) =>
      doctorApi.updateAvailabilitySlot(slotId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: DOCTOR_QUERY_KEYS.availability }),
  });
};

/** GET /api/consultations/doctor/requests — incoming consultation requests. */
export const useDoctorConsultationRequests = () =>
  useQuery({
    queryKey: DOCTOR_QUERY_KEYS.consultationRequests,
    queryFn: () => doctorApi.getConsultationRequests().then((r) => r.data.data),
  });

/** Confirm a patient's consultation request. */
export const useConfirmConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => doctorApi.confirmConsultation(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: DOCTOR_QUERY_KEYS.consultationRequests }),
  });
};

/** Reject a consultation request with an optional reason. */
export const useRejectConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      doctorApi.rejectConsultation(id, { reason }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: DOCTOR_QUERY_KEYS.consultationRequests }),
  });
};
