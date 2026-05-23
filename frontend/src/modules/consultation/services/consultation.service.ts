import type { ConsultationDto } from '../types/consultation.types';

export const consultationService = {
  isJoinable: (consultation: ConsultationDto): boolean =>
    consultation.status === 'Confirmed' || consultation.status === 'InProgress',
  getStatusLabel: (status: ConsultationDto['status']): string => {
    const map: Record<ConsultationDto['status'], string> = {
      Pending: 'Pending',
      Confirmed: 'Confirmed',
      InProgress: 'In Progress',
      Completed: 'Completed',
      Cancelled: 'Cancelled',
      NoShow: 'No Show',
    };
    return map[status];
  },
};
