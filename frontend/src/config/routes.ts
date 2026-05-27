/**
 * Centralized Route Constants
 * Source of truth: frontend/SDD/auth.md — Route Structure tables.
 *
 * Patient-first architecture (v2):
 *  - /login          → Patient OTP login (default entry point)
 *  - /verify-otp     → OTP verification
 *  - /doctor         → Doctor landing page (public)
 *  - /doctor/login   → Doctor credential login
 *  - /doctor/register→ Doctor registration
 *  - /admin/login    → Admin portal (hidden, internal only)
 *
 * Use these constants everywhere instead of hardcoded strings.
 */

export const ROUTES = {
  // ── Public ─────────────────────────────────────────────────────────────────
  home: '/',

  // ── Patient Auth (primary entry) ───────────────────────────────────────────
  login: '/login',
  verifyOtp: '/verify-otp',

  // ── Auth (legacy aliases — redirect to new routes) ─────────────────────────
  auth: {
    /** @deprecated use ROUTES.login */
    patientLogin: '/login',
    /** @deprecated use ROUTES.verifyOtp */
    patientOtp: '/verify-otp',
    /** @deprecated use ROUTES.doctor.login */
    login: '/doctor/login',
    /** @deprecated use ROUTES.doctor.register */
    register: '/doctor/register',
    /** @deprecated removed — redirects to /login */
    role: '/login',
  },

  // ── Patient ────────────────────────────────────────────────────────────────
  patient: {
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

/** Default unauthenticated redirect target — patient-first: /login */
export const UNAUTHENTICATED_REDIRECT = ROUTES.login;
