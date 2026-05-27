/**
 * Doctor Module Types
 * Aligned 1:1 with backend/Modules/Doctor/DTOs/DoctorDto.cs (camelCase mapped)
 * and backend/Modules/Doctor/SDD/APIs.md response shapes.
 */

export type DoctorApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended';

// ─── Authenticated Doctor Profile ─────────────────────────────────────────────

/** Maps: DoctorProfileResponse — full private profile for authenticated doctor */
export type DoctorProfileDto = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  licenseNumber: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  consultationFee: number | null;
  hospitalName: string | null;
  clinicAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languagesSpoken: string[];
  approvalStatus: DoctorApprovalStatus;
  rating: number | null;
  totalReviews: number;
  totalConsultations: number;
  isProfileCompleted: boolean;
  isPubliclyVisible: boolean;
  createdAt: string;
  updatedAt: string | null;
};

// ─── Public Doctor Listing ────────────────────────────────────────────────────

/** Maps: DoctorPublicListItemResponse — used in patient doctor search */
export type DoctorPublicListItem = {
  id: string;
  fullName: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  rating: number | null;
  totalReviews: number;
  city: string | null;
  languagesSpoken: string[];
  profileImageUrl: string | null;
};

/** Maps: DoctorPublicDetailResponse — full public detail + availability */
export type DoctorPublicDetail = {
  id: string;
  fullName: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  bio: string | null;
  consultationFee: number | null;
  hospitalName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languagesSpoken: string[];
  rating: number | null;
  totalReviews: number;
  profileImageUrl: string | null;
  availability: DoctorPublicAvailabilitySlot[];
};

export type DoctorPublicAvailabilitySlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

// ─── Availability ─────────────────────────────────────────────────────────────

/** Maps: AvailabilityResponse */
export type DoctorAvailabilitySlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
};

// ─── Doctor Search Params ─────────────────────────────────────────────────────

export type DoctorSearchParams = {
  city?: string;
  specialization?: string;
  language?: string;
  minFee?: number;
  maxFee?: number;
  page?: number;
  pageSize?: number;
};

export type AvailabilityStatus = 'Available' | 'Busy' | 'Offline';

