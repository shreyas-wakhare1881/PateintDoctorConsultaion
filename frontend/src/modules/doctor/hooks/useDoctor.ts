import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi } from '../api/doctor.api';
import { ROUTES } from '@/config/routes';
import { getNotificationHubConnection } from '@/services/signalr-client';
import { socketConfig } from '@/config/socket.config';
import type { PaginatedResponse } from '@/types/api.types';
import type {
  DoctorApprovalStatus,
  DoctorProfileDto,
  DoctorPublicDetail,
  DoctorPublicListItem,
} from '../types/doctor.types';

export const DOCTOR_QUERY_KEYS = {
  profile: ['doctor', 'profile'] as const,
  availability: ['doctor', 'availability'] as const,
  consultationRequests: ['doctor', 'consultations', 'requests'] as const,
  publicList: (params?: unknown) => ['doctors', 'public', params] as const,
  publicById: (id: string) => ['doctors', 'public', id] as const,
};

export const useDoctorProfile = (options?: { refetchInterval?: number }) =>
  useQuery<DoctorProfileDto>({
    queryKey: DOCTOR_QUERY_KEYS.profile,
    queryFn: () => doctorApi.getProfile().then((r) => r.data.data),
    refetchInterval: options?.refetchInterval,
    // 404 means the Doctor stub row doesn't exist yet (pre-setup).
    // Don't retry on 404 — we'll handle it via isError in the status gate.
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });

/**
 * useDoctorStatusGate — fetches doctor profile and enforces status-based routing.
 * Handles: no profile (404) → setup, incomplete → setup, Pending/Rejected/Suspended → respective pages.
 */
export const useDoctorStatusGate = () => {
  const router = useRouter();
  const { data: profile, isLoading, isError, error } = useDoctorProfile();

  useEffect(() => {
    if (isLoading) return;

    // 404 = no Doctor row yet → need to complete setup
    if (isError) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        router.replace(ROUTES.doctor.setup);
      }
      return;
    }

    if (!profile) return;

    if (!profile.isProfileCompleted) {
      router.replace(ROUTES.doctor.setup);
      return;
    }

    switch (profile.approvalStatus) {
      case 'Pending':
        router.replace(ROUTES.doctor.pending);
        break;
      case 'Rejected':
        router.replace(ROUTES.doctor.rejected);
        break;
      case 'Suspended':
        router.replace(ROUTES.doctor.suspended);
        break;
      // 'Approved' — stay on current page
    }
  }, [profile, isLoading, isError, error, router]);

  const isApproved = profile?.approvalStatus === 'Approved';

  return { profile, isLoading, isError, isApproved };
};

/**
 * useDoctorPendingPoller — polls doctor profile and enforces status-page ownership.
 * Also subscribes to the SignalR `DoctorStatusUpdated` event for real-time redirect
 * the instant an admin approves / rejects / suspends the doctor.
 *
 * expectedStatus route mapping:
 *  - Pending   -> /doctor/pending
 *  - Rejected  -> /doctor/rejected
 *  - Suspended -> /doctor/suspended
 *
 * Any mismatch redirects to the canonical lifecycle route.
 */
export const useDoctorPendingPoller = (expectedStatus: DoctorApprovalStatus = 'Pending') => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile, isError, error } = useDoctorProfile({ refetchInterval: 60_000 });

  // ── Polling-based redirect ────────────────────────────────────────────────
  useEffect(() => {
    // 404 = no Doctor row → redirect to setup
    if (isError) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) router.replace(ROUTES.doctor.setup);
      return;
    }

    if (!profile) return;

    const statusRoutes: Record<DoctorApprovalStatus, string> = {
      Approved: ROUTES.doctor.dashboard,
      Pending: ROUTES.doctor.pending,
      Rejected: ROUTES.doctor.rejected,
      Suspended: ROUTES.doctor.suspended,
    };

    if (!profile.isProfileCompleted) {
      router.replace(ROUTES.doctor.setup);
      return;
    }

    const expectedRoute = statusRoutes[expectedStatus];
    const canonicalRoute = statusRoutes[profile.approvalStatus];

    if (canonicalRoute !== expectedRoute) {
      router.replace(canonicalRoute);
    }
  }, [profile, isError, error, router, expectedStatus]);

  // ── Real-time SignalR redirect ────────────────────────────────────────────
  useEffect(() => {
    const hub = getNotificationHubConnection();

    const handleStatusUpdated = () => {
      // Invalidate the cached profile so the polling useEffect above re-runs
      // with the fresh ApprovalStatus and performs the correct redirect immediately.
      queryClient.invalidateQueries({ queryKey: DOCTOR_QUERY_KEYS.profile });
    };

    hub.on(socketConfig.events.doctorStatusUpdated, handleStatusUpdated);

    return () => {
      hub.off(socketConfig.events.doctorStatusUpdated, handleStatusUpdated);
    };
  }, [queryClient]);

  return { profile };
};

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

/** Delete an availability slot by its ID. */
export const useDeleteAvailabilitySlot = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => doctorApi.deleteAvailabilitySlot(slotId),
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

/** GET /api/doctors — public listing (patient-facing). */
export const usePublicDoctorList = (params?: Record<string, unknown>) =>
  useQuery<PaginatedResponse<DoctorPublicListItem>>({
    queryKey: DOCTOR_QUERY_KEYS.publicList(params),
    queryFn: () => doctorApi.getPublicList(params).then((r) => r.data.data),
  });

/** GET /api/doctors/{id} — public doctor detail (patient-facing). */
export const usePublicDoctorById = (doctorId: string) =>
  useQuery<DoctorPublicDetail>({
    queryKey: DOCTOR_QUERY_KEYS.publicById(doctorId),
    queryFn: () => doctorApi.getPublicById(doctorId).then((r) => r.data.data),
    enabled: !!doctorId,
  });
