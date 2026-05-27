import { create } from 'zustand';

export type ConsultationStatus =
  | 'Pending'
  | 'Confirmed'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'NoShow';

export interface ActiveConsultation {
  id: string;
  roomId: string;
}

interface ConsultationState {
  activeConsultation: ActiveConsultation | null;
  isCallActive: boolean;
  isMicMuted: boolean;
  isCameraOff: boolean;
  setActiveConsultation: (consultation: ActiveConsultation | null) => void;
  setCallActive: (active: boolean) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  endCall: () => void;
}

export const useConsultationStore = create<ConsultationState>((set) => ({
  activeConsultation: null,
  isCallActive: false,
  isMicMuted: false,
  isCameraOff: false,
  setActiveConsultation: (activeConsultation) => set({ activeConsultation }),
  setCallActive: (isCallActive) => set({ isCallActive }),
  toggleMic: () => set((s) => ({ isMicMuted: !s.isMicMuted })),
  toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),
  endCall: () =>
    set({
      activeConsultation: null,
      isCallActive: false,
      isMicMuted: false,
      isCameraOff: false,
    }),
}));
