/**
 * Application Constants
 * Source of truth: frontend/SDD/*.md
 */

// ── Auth ───────────────────────────────────────────────────────────────────────
export const AUTH_CONSTANTS = {
  /**
   * OTP digit count — 4 digits.
   * Source of truth: backend/Modules/Auth/Validators/AuthValidators.cs
   *   VerifyOtpRequestValidator: .Matches(@"^\d{4}$")
   * Dev OTP is always "1234" — see backend/Infrastructure/Identity/OTP/OtpService.cs
   */
  OTP_LENGTH: 4,
  /** OTP validity window in seconds (5 min, matches backend OtpExpiryMinutes = 5). */
  OTP_TTL_SECONDS: 5 * 60,
  /** Access token TTL in seconds (60 min — matches backend JwtExpiryMinutes = 60). */
  ACCESS_TOKEN_TTL_SECONDS: 60 * 60,
  /** Refresh token TTL in days (7 days — matches backend RefreshTokenExpiryDays = 7). */
  REFRESH_TOKEN_TTL_DAYS: 7,
  /** localStorage key for persisted refresh token. */
  REFRESH_TOKEN_STORAGE_KEY: 'pdc_rt',
} as const;

// ── Pagination ─────────────────────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  ADMIN_DEFAULT_PAGE_SIZE: 20,
  ADMIN_MAX_PAGE_SIZE: 100,
} as const;

// ── Consultation ───────────────────────────────────────────────────────────────
export const CONSULTATION_CONSTANTS = {
  /** Minutes before scheduled time that "Join Now" button becomes active. */
  JOIN_WINDOW_MINUTES: 15,
  /** Video reconnect retry count. */
  VIDEO_RECONNECT_RETRIES: 3,
  /** Video reconnect interval in milliseconds. */
  VIDEO_RECONNECT_INTERVAL_MS: 2000,
  /** Minimum symptom description length (matches backend validation). */
  SYMPTOMS_MIN_LENGTH: 10,
  /** Maximum symptom description length (matches backend validation). */
  SYMPTOMS_MAX_LENGTH: 2000,
  /** Minimum cancellation reason length (matches backend validation). */
  CANCEL_REASON_MIN_LENGTH: 10,
  CANCEL_REASON_MAX_LENGTH: 500,
} as const;

// ── Doctor ─────────────────────────────────────────────────────────────────────
export const DOCTOR_CONSTANTS = {
  /** Doctor approval status polling interval (ms) — used on pending screen. */
  APPROVAL_POLL_INTERVAL_MS: 60_000,
  MIN_SLOT_DURATION_MINUTES: 10,
  MAX_SLOT_DURATION_MINUTES: 120,
} as const;

// ── UI ─────────────────────────────────────────────────────────────────────────
export const UI_CONSTANTS = {
  /** Debounce delay for search inputs. */
  SEARCH_DEBOUNCE_MS: 300,
  /** Toast auto-dismiss duration. */
  TOAST_DURATION_MS: 4000,
  /** Skeleton loading item count (default). */
  SKELETON_COUNT: 3,
  /** Mobile breakpoint (matches Tailwind `md`). */
  MOBILE_BREAKPOINT_PX: 768,
} as const;

// ── App ─────────────────────────────────────────────────────────────────────────
export const APP_CONSTANTS = {
  NAME: 'PatientDoctorConsultation',
  SHORT_NAME: 'PDC',
} as const;
