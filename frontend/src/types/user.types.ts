/**
 * User Types
 * Source of truth: backend/Modules/Patient/SDD/APIs.md + Doctor/SDD/APIs.md
 */

import type { UserRole } from './auth.types';

// ── Shared ────────────────────────────────────────────────────────────────────

export type Gender = 'Male' | 'Female' | 'Other' | 'PreferNotToSay';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
export type ConsultationStatus =
  | 'Pending'
  | 'Confirmed'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected'
  | 'NoShow';
export type ConsultationType = 'Video' | 'InPerson';

// ── Patient ───────────────────────────────────────────────────────────────────

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  bloodGroup: BloodGroup | null;
  heightCm: number | null;
  weightKg: number | null;
  allergies: string | null;
  chronicDiseases: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  profileImageUrl: string | null;
  isProfileCompleted: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// ── Doctor ────────────────────────────────────────────────────────────────────

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  licenseNumber: string;
  bio: string | null;
  profileImageUrl: string | null;
  consultationFee: number;
  hospitalName: string | null;
  clinicAddress: string | null;
  city: string;
  state: string | null;
  country: string | null;
  languagesSpoken: string[];
  approvalStatus: ApprovalStatus;
  rating: number;
  totalReviews: number;
  totalConsultations: number;
  isProfileCompleted: boolean;
  isPubliclyVisible: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/** Public-facing doctor summary (from GET /api/doctors list). */
export interface PublicDoctorSummary {
  id: string;
  fullName: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  rating: number;
  totalReviews: number;
  city: string;
  languagesSpoken: string[];
  profileImageUrl: string | null;
}

export interface DoctorAvailabilitySlot {
  id: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  slotDurationMinutes: number;
  isAvailable: boolean;
}

// ── Generic User (used in admin listing) ─────────────────────────────────────

export interface UserSummary {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
}
