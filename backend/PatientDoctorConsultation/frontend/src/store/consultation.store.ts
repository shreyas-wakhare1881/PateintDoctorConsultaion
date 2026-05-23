import { create } from 'zustand';

export type ConsultationStatus =
  | 'idle'
  | 'booked'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

interface ActiveConsultation {
  consultationId: string;
  roomId: string;
  livekitToken: string;
  status: ConsultationStatus;
}

interface ConsultationState {
  active: ActiveConsultation | null;
  setActive: (consultation: ActiveConsultation) => void;
  updateStatus: (status: ConsultationStatus) => void;
  clearActive: () => void;
}

export const useConsultationStore = create<ConsultationState>()((set) => ({
  active: null,
  setActive: (consultation) => set({ active: consultation }),
  updateStatus: (status) =>
    set((state) =>
      state.active ? { active: { ...state.active, status } } : state,
    ),
  clearActive: () => set({ active: null }),
}));
