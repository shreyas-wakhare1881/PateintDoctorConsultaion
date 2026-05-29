/**
 * Admin Module API
 * All endpoints aligned with backend/Modules/Admin/SDD/APIs.md
 * and api.config.ts as the single source of truth.
 */

import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';

export const adminApi = {
  // ── Dashboard ─────────────────────────────────────────────────────────────

  /** GET /api/admin/dashboard — aggregate platform statistics */
  getDashboard: () => apiClient.get(apiConfig.endpoints.admin.dashboard),

  // ── Doctor Governance ─────────────────────────────────────────────────────

  /** GET /api/admin/doctors — all doctors (with optional filters) */
  getDoctors: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.admin.doctors, { params }),

  /** GET /api/admin/doctors/pending — doctors awaiting approval */
  getPendingDoctors: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get(apiConfig.endpoints.admin.doctorsPending, { params }),

  /** PATCH /api/admin/doctors/{doctorId}/approve */
  approveDoctor: (doctorId: string, reason?: string) =>
    apiClient.patch(apiConfig.endpoints.admin.doctorApprove(doctorId), { reason: reason ?? null }),

  /** PATCH /api/admin/doctors/{doctorId}/reject */
  rejectDoctor: (doctorId: string, reason: string) =>
    apiClient.patch(apiConfig.endpoints.admin.doctorReject(doctorId), { reason }),

  /** PATCH /api/admin/doctors/{doctorId}/suspend */
  suspendDoctor: (doctorId: string, reason: string) =>
    apiClient.patch(apiConfig.endpoints.admin.doctorSuspend(doctorId), { reason }),

  /** PATCH /api/admin/doctors/{doctorId}/reactivate */
  reactivateDoctor: (doctorId: string, reason?: string) =>
    apiClient.patch(apiConfig.endpoints.admin.doctorReactivate(doctorId), { reason: reason ?? null }),

  // ── Patient Moderation ────────────────────────────────────────────────────

  /** GET /api/admin/patients */
  getPatients: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.admin.patients, { params }),

  /** PATCH /api/admin/patients/{userId}/block */
  blockPatient: (userId: string, reason: string) =>
    apiClient.patch(apiConfig.endpoints.admin.patientBlock(userId), { reason }),

  /** PATCH /api/admin/patients/{userId}/unblock */
  unblockPatient: (userId: string) =>
    apiClient.patch(apiConfig.endpoints.admin.patientUnblock(userId), { reason: null }),

  // ── Consultation Oversight (read-only) ─────────────────────────────────────

  /** GET /api/admin/consultations */
  getConsultations: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.admin.consultations, { params }),

  /** GET /api/admin/consultations/{consultationId} */
  getConsultationById: (consultationId: string) =>
    apiClient.get(apiConfig.endpoints.admin.consultationById(consultationId)),

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  /** GET /api/admin/audit-logs */
  getAuditLogs: (params?: Record<string, unknown>) =>
    apiClient.get(apiConfig.endpoints.admin.auditLogs, { params }),
};
