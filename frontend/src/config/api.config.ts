import { env } from './env';

/**
 * API Configuration
 * Source of truth: All backend Module SDD/APIs.md files.
 * DO NOT invent endpoints — all paths MUST match backend SDD exactly.
 */
export const apiConfig = {
  baseUrl: env.apiBaseUrl,
  aiServiceUrl: env.aiServiceUrl,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  endpoints: {
    // ── Auth Module — base: /api/auth ─────────────────────────────────────────
    auth: {
      sendOtp: '/api/auth/send-otp',
      verifyOtp: '/api/auth/verify-otp',
      register: '/api/auth/register',
      login: '/api/auth/login',
      refresh: '/api/auth/refresh',
      logout: '/api/auth/logout',
      me: '/api/auth/me',
      profile: '/api/auth/profile',
    },

    // ── Patient Module — base: /api/patients ──────────────────────────────────
    patients: {
      profile: '/api/patients/profile',
      me: '/api/patients/me',
    },

    // ── Doctor Module — base: /api/doctors ────────────────────────────────────
    doctors: {
      /** POST /api/doctors/profile — create doctor profile (Doctor role) */
      profile: '/api/doctors/profile',
      /** GET /api/doctors/profile/me — get authenticated doctor profile (Doctor role) */
      me: '/api/doctors/profile/me',
      /** PATCH /api/doctors/profile/me — update authenticated doctor profile (Doctor role) */
      profileUpdate: '/api/doctors/profile/me',
      /** POST /api/doctors/availability — add availability slot */
      availability: '/api/doctors/availability',
      /** GET /api/doctors/availability/me — get my availability slots */
      availabilityMe: '/api/doctors/availability/me',
      /** PATCH /api/doctors/availability/{slotId} — update a slot */
      availabilityById: (id: string) => `/api/doctors/availability/${id}`,
      /** GET /api/doctors — public listing (no auth required) */
      public: '/api/doctors',
      /** GET /api/doctors/{id} — public single doctor */
      publicById: (doctorId: string) => `/api/doctors/${doctorId}`,
    },

    // ── Consultation Module — base: /api/consultations ────────────────────────
    consultations: {
      /** POST /api/consultations — patient books a consultation */
      book: '/api/consultations',
      /** GET /api/consultations/my — patient gets their own consultations */
      my: '/api/consultations/my',
      /** GET /api/consultations/doctor/requests — doctor gets pending consultation requests */
      requests: '/api/consultations/doctor/requests',
      /** GET /api/consultations/{id} */
      byId: (id: string) => `/api/consultations/${id}`,
      /** PUT /api/consultations/{id}/cancel */
      cancel: (id: string) => `/api/consultations/${id}/cancel`,
      /** PUT /api/consultations/{id}/confirm — doctor confirms */
      confirm: (id: string) => `/api/consultations/${id}/confirm`,
      /** PUT /api/consultations/{id}/reject — doctor rejects */
      reject: (id: string) => `/api/consultations/${id}/reject`,
      /** PUT /api/consultations/{id}/start */
      start: (id: string) => `/api/consultations/${id}/start`,
      /** PUT /api/consultations/{id}/complete */
      complete: (id: string) => `/api/consultations/${id}/complete`,
      /** GET /api/consultations/{id}/history */
      history: (id: string) => `/api/consultations/${id}/history`,
      /** POST /api/consultations/{id}/video-token — issues LiveKit access token */
      videoToken: (id: string) => `/api/consultations/${id}/video-token`,
      /** POST /api/consultations/{id}/prescription — doctor creates prescription */
      prescription: (id: string) => `/api/consultations/${id}/prescription`,
    },

    // ── Prescription Module — base: /api/prescriptions ───────────────────────
    prescriptions: {
      /** GET /api/prescriptions/my — patient gets all their prescriptions */
      my: '/api/prescriptions/my',
    },

    // ── Admin Module — base: /api/admin ───────────────────────────────────────
    admin: {
      dashboard: '/api/admin/dashboard',
      doctorsPending: '/api/admin/doctors/pending',
      doctors: '/api/admin/doctors',
      doctorApprove: (doctorId: string) => `/api/admin/doctors/${doctorId}/approve`,
      doctorReject: (doctorId: string) => `/api/admin/doctors/${doctorId}/reject`,
      doctorSuspend: (doctorId: string) => `/api/admin/doctors/${doctorId}/suspend`,
      doctorReactivate: (doctorId: string) => `/api/admin/doctors/${doctorId}/reactivate`,
      patients: '/api/admin/patients',
      patientBlock: (userId: string) => `/api/admin/patients/${userId}/block`,
      patientUnblock: (userId: string) => `/api/admin/patients/${userId}/unblock`,
      consultations: '/api/admin/consultations',
      consultationById: (consultationId: string) => `/api/admin/consultations/${consultationId}`,
      auditLogs: '/api/admin/audit-logs',
    },
  },
} as const;
