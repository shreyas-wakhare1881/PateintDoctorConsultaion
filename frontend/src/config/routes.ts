/**
 * Centralized Route Constants
 * Source of truth: frontend/SDD/auth.md — Route Structure tables.
 *
 * Patient-first architecture (v2):
 *  - /patient/login  → Patient OTP login (primary entry point)
 *  - /verify-otp     → OTP verification
 *  - /doctor         → Doctor landing page (public)
 *  - /doctor/login   → Doctor credential login
 *  - /doctor/register→ Doctor registration
 *  - /admin/login    → Admin portal (hidden, internal only)
 *
 * Legacy route: /login → redirects to /patient/login (backwards compat only)
 *
 * Use these constants everywhere instead of hardcoded strings.
 */

export const ROUTES = {
  // ── Public ─────────────────────────────────────────────────────────────────
  home: '/',

  // ── Patient Auth (primary entry) ───────────────────────────────────────────
  /** Canonical patient login URL — /patient/login */
  login: '/patient/login',
  verifyOtp: '/verify-otp',
  /** Legacy /login → redirects to /patient/login (do not use in new code) */
  loginLegacy: '/login',

  // ── Auth (legacy aliases — redirect to new routes) ─────────────────────────
  auth: {
    /** @deprecated use ROUTES.login */
    patientLogin: '/patient/login',
    /** @deprecated use ROUTES.verifyOtp */
    patientOtp: '/verify-otp',
    /** @deprecated use ROUTES.doctor.login */
    login: '/doctor/login',
    /** @deprecated use ROUTES.doctor.register */
    register: '/doctor/register',
    /** @deprecated use / directly; /role is legacy role-redirect route */
    role: '/role',
  },

  // ── Patient ────────────────────────────────────────────────────────────────
  patient: {
    login: '/patient/login',
    setup: '/patient/setup',
    dashboard: '/patient/dashboard',
    profile: '/patient/profile',
    profileEdit: '/patient/profile/edit',
    doctors: '/patient/doctors',
    doctorProfile: (doctorId: string) => `/patient/doctors/${doctorId}`,
    book: (doctorId: string) => `/patient/book/${doctorId}`,
    /**
     * Consultation list / history — maps to /patient/consultation-history.
     * Backend: GET /api/consultations/my
     * "appointments" and "history" are the same data — one unified list.
     */
    consultations: '/patient/consultation-history',
    consultationDetail: (id: string) => `/patient/consultations/${id}`,
    /** Patient prescription history — GET /api/prescriptions/my */
    prescriptions: '/patient/prescriptions',
  },

  // ── Doctor ─────────────────────────────────────────────────────────────────
  doctor: {
    landing: '/doctor',
    login: '/doctor/login',
    register: '/doctor/register',
    setup: '/doctor/setup',
    pending: '/doctor/pending',
    rejected: '/doctor/rejected',
    suspended: '/doctor/suspended',
    dashboard: '/doctor/dashboard',
    profile: '/doctor/profile',
    profileEdit: '/doctor/profile/edit',
    availability: '/doctor/availability',
    /**
     * Doctor consultation list (requests + active).
     * Backend: GET /api/consultations/doctor/requests
     * Maps to /doctor/consultations page.
     */
    consultations: '/doctor/consultations',
    consultationDetail: (id: string) => `/doctor/consultations/${id}`,
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  admin: {
    login: '/admin/login',
    dashboard: '/admin/dashboard',
    doctors: '/admin/doctors',
    doctorsPending: '/admin/doctors/pending',
    doctorDetail: (doctorId: string) => `/admin/doctors/${doctorId}`,
    patients: '/admin/patients',
    patientDetail: (userId: string) => `/admin/patients/${userId}`,
    consultations: '/admin/consultations',
    consultationDetail: (id: string) => `/admin/consultations/${id}`,
    auditLogs: '/admin/audit-logs',
  },

  // ── Consultation ───────────────────────────────────────────────────────────
  consultation: {
    /** Video call room — matches Next.js page at /consultation/video-call/[roomId] */
    videoRoom: (roomId: string) => `/consultation/video-call/${roomId}`,
  },
} as const;

/** Role-to-dashboard redirect map. Matches SDD redirect matrix. */
export const ROLE_DASHBOARD: Record<string, string> = {
  Patient: ROUTES.patient.dashboard,
  Doctor: ROUTES.doctor.dashboard,
  Admin: ROUTES.admin.dashboard,
};

/** Role-to-login redirect map — used by guards and session-expired modal. */
export const ROLE_LOGIN: Record<string, string> = {
  Patient: ROUTES.patient.login,
  Doctor: ROUTES.doctor.login,
  Admin: ROUTES.admin.login,
};

/** Default unauthenticated redirect target — /patient/login */
export const UNAUTHENTICATED_REDIRECT = ROUTES.login;
