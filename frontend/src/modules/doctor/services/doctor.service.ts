import type { AvailabilityStatus } from '../types/doctor.types';

export const doctorService = {
  getAvailabilityLabel: (status: AvailabilityStatus): string => {
    const map: Record<AvailabilityStatus, string> = {
      Available: 'Available',
      Busy: 'In Consultation',
      Offline: 'Offline',
    };
    return map[status];
  },
};
