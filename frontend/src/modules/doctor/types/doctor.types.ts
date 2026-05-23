export type DoctorProfileDto = {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  phoneNumber?: string;
  bio?: string;
  avatarUrl?: string;
  consultationFee: number;
  isAvailable: boolean;
  createdAt: string;
};

export type AvailabilityStatus = 'Available' | 'Busy' | 'Offline';
