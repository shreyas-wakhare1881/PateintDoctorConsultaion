/**
 * Common Types — barrel re-export.
 * Import from '@/types' rather than from individual files.
 */

export type { ApiResponse, PaginatedResponse, ApiError, PaginationParams } from './api.types';
export type {
  UserRole,
  JwtPayload,
  AuthUserDto,
  TokenResponseDto,
  SendOtpRequest,
  VerifyOtpRequest,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthState,
} from './auth.types';
export type {
  Gender,
  BloodGroup,
  ApprovalStatus,
  ConsultationStatus,
  ConsultationType,
  PatientProfile,
  DoctorProfile,
  PublicDoctorSummary,
  DoctorAvailabilitySlot,
  UserSummary,
} from './user.types';

