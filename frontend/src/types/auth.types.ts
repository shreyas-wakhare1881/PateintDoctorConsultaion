/**
 * Auth Types
 * Source of truth: frontend/SDD/auth.md + backend/Modules/Auth/SDD/APIs.md
 */

export type UserRole = 'Patient' | 'Doctor' | 'Admin';

// ── JWT ───────────────────────────────────────────────────────────────────────

/** Decoded JWT claims — matches backend JWT generation spec. */
export interface JwtPayload {
  sub: string;       // User UUID
  email: string | null;
  role: UserRole;
  jti: string;       // Unique token ID (future revocation)
  iat: number;
  exp: number;
}

// ── Auth Responses ────────────────────────────────────────────────────────────

/** The authenticated user object returned from auth endpoints. */
export interface AuthUserDto {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  isVerified: boolean;
}

/** Token pair returned by verify-otp, login, and refresh endpoints. */
export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: AuthUserDto;
}

// ── Request Bodies ─────────────────────────────────────────────────────────────

export interface SendOtpRequest {
  phoneNumber: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  role: 'Doctor' | 'Admin';
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
  role: 'Doctor';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ── Auth State ─────────────────────────────────────────────────────────────────

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUserDto | null;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
}
