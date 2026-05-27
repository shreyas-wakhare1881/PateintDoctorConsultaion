import type { ConsultationDetailsDto, ConsultationStatus } from '../types/consultation.types';

export const consultationService = {
  isJoinable: (consultation: ConsultationDetailsDto): boolean =>
    consultation.status === 'Confirmed' || consultation.status === 'InProgress',
  getStatusLabel: (status: ConsultationStatus): string => {
    const map: Record<ConsultationStatus, string> = {
      Pending: 'Pending',
      Confirmed: 'Confirmed',
      Rejected: 'Rejected',
      InProgress: 'In Progress',
      Completed: 'Completed',
      Cancelled: 'Cancelled',
      NoShow: 'No Show',
    };
    return map[status];
  },
};
