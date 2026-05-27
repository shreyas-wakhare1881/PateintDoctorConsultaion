/**
 * Doctor Module API
 * All endpoints aligned with backend/Modules/Doctor/SDD/APIs.md
 * and api.config.ts as the single source of truth.
 */

import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export const doctorApi = {
  // ── Profile ──────────────────────────────────────────────────────────────

  /** POST /api/doctors/profile — create doctor profile (first-time setup) */
  createProfile: (data: unknown) =>
    apiClient.post(apiConfig.endpoints.doctors.profile, data),

  /** GET /api/doctors/profile/me — fetch authenticated doctor profile */
  getProfile: () => apiClient.get(apiConfig.endpoints.doctors.me),

  /** PATCH /api/doctors/profile/me — partial update of doctor profile */
  updateProfile: (data: unknown) =>
    apiClient.patch(apiConfig.endpoints.doctors.profileUpdate, data),

  // ── Availability ─────────────────────────────────────────────────────────

  /** GET /api/doctors/availability/me — list own availability slots */
  getAvailability: () =>
    apiClient.get(apiConfig.endpoints.doctors.availabilityMe),

  /** POST /api/doctors/availability — add a new availability slot */
  addAvailabilitySlot: (data: unknown) =>
    apiClient.post(apiConfig.endpoints.doctors.availability, data),

  /** PATCH /api/doctors/availability/{slotId} — update a single slot */
  updateAvailabilitySlot: (slotId: string, data: unknown) =>
    apiClient.patch(apiConfig.endpoints.doctors.availabilityById(slotId), data),

  // ── Consultations ─────────────────────────────────────────────────────────

  /** GET /api/consultations/doctor/requests — incoming consultation requests */
  getConsultationRequests: () =>
    apiClient.get(apiConfig.endpoints.consultations.requests),

  /** PUT /api/consultations/{id}/confirm — doctor confirms a request */
  confirmConsultation: (id: string) =>
    apiClient.put(apiConfig.endpoints.consultations.confirm(id), {}),

  /** PUT /api/consultations/{id}/reject — doctor rejects a request */
  rejectConsultation: (id: string, data: { reason?: string }) =>
    apiClient.put(apiConfig.endpoints.consultations.reject(id), data),

  /** PUT /api/consultations/{id}/start — doctor starts the session */
  startConsultation: (id: string) =>
    apiClient.put(apiConfig.endpoints.consultations.start(id), {}),

  /** PUT /api/consultations/{id}/complete — doctor marks session complete */
  completeConsultation: (id: string) =>
    apiClient.put(apiConfig.endpoints.consultations.complete(id), {}),

  /** GET /api/consultations/{id} — get full consultation detail */
  getConsultationById: (id: string) =>
    apiClient.get(apiConfig.endpoints.consultations.byId(id)),

  // ── Public ─────────────────────────────────────────────────────────────────

  /** GET /api/doctors — public listing (no auth required) */
  getPublicList: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.doctors.public, { params }),

  /** GET /api/doctors/{id} — public single doctor profile */
  getPublicById: (doctorId: string) =>
    apiClient.get(apiConfig.endpoints.doctors.publicById(doctorId)),
};
