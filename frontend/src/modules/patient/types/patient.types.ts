export type PatientProfileDto = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  avatarUrl?: string;
  createdAt: string;
};

export type DoctorListItemDto = {
  id: string;
  fullName: string;
  specialization: string;
  avatarUrl?: string;
  consultationFee: number;
  isAvailable: boolean;
};
