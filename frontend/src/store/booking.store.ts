/**
 * Booking Store — ephemeral state for consultation booking flow.
 * Source of truth: frontend/SDD/patient.md — State Management Strategy
 *
 * Cleared after successful booking or when user navigates away.
 * NOT persisted — intentional.
 */

import { create } from 'zustand';
import type { ConsultationType } from '@/types/user.types';

interface BookingState {
  /** The doctor being booked. */
  selectedDoctorId: string | null;
  /** The availability slot ID selected from the slot picker. */
  selectedAvailabilityId: string | null;
  /** ISO date string: "2026-06-10" */
  selectedDate: string | null;
  /** HH:mm:ss */
  selectedStartTime: string | null;
  /** HH:mm:ss */
  selectedEndTime: string | null;
  consultationType: ConsultationType;
  symptoms: string;
  isFollowUp: boolean;
  parentConsultationId: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setDoctor: (doctorId: string) => void;
  setSlot: (params: {
    availabilityId: string | null;
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
  setConsultationType: (type: ConsultationType) => void;
  setSymptoms: (symptoms: string) => void;
  setFollowUp: (isFollowUp: boolean, parentId: string | null) => void;
  /** Reset all booking state (call after successful booking). */
  reset: () => void;
}

const defaultState = {
  selectedDoctorId: null,
  selectedAvailabilityId: null,
  selectedDate: null,
  selectedStartTime: null,
  selectedEndTime: null,
  consultationType: 'Video' as ConsultationType,
  symptoms: '',
  isFollowUp: false,
  parentConsultationId: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...defaultState,

  setDoctor: (doctorId) => set({ selectedDoctorId: doctorId }),

  setSlot: ({ availabilityId, date, startTime, endTime }) =>
    set({
      selectedAvailabilityId: availabilityId,
      selectedDate: date,
      selectedStartTime: startTime,
      selectedEndTime: endTime,
    }),

  setConsultationType: (consultationType) => set({ consultationType }),

  setSymptoms: (symptoms) => set({ symptoms }),

  setFollowUp: (isFollowUp, parentConsultationId) =>
    set({ isFollowUp, parentConsultationId }),

  reset: () => set(defaultState),
}));
