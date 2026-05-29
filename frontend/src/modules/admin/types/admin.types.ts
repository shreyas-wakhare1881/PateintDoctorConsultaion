/**
 * Admin Module Types
 * Aligned 1:1 with backend/Modules/Admin/DTOs/AdminDto.cs (camelCase mapped)
 * and backend/Modules/Admin/SDD/APIs.md response shapes.
 */

// ─── Dashboard ────────────────────────────────────────────────────────────────

/** Maps: AdminDashboardResponse C# record */
export type AdminDashboardDto = {
  totalDoctors: number;
  pendingDoctors: number;
  suspendedDoctors: number;
  totalActivePatients: number;
  totalConsultations: number;
  completedConsultations: number;
  cancelledConsultations: number;
  todayConsultations: number;
};

// ─── Doctor Moderation ────────────────────────────────────────────────────────

export type DoctorApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended';

/** Maps: AdminDoctorListItem */
export type AdminDoctorListItem = {
  doctorId: string;
  userId: string;
  fullName: string;
  email: string | null;
  specialization: string | null;
  approvalStatus: DoctorApprovalStatus;
  isPubliclyVisible: boolean;
  isProfileCompleted: boolean;
  city: string | null;
  createdAt: string;
};

/** Maps: AdminPendingDoctorItem — enriched for the approval queue */
export type AdminPendingDoctorItem = {
  doctorId: string;
  userId: string;
  fullName: string;
  email: string | null;
  specialization: string | null;
  qualification: string | null;
  licenseNumber: string | null;
  experienceYears: number | null;
  city: string | null;
  isProfileCompleted: boolean;
  createdAt: string;
};

/** Maps: DoctorModerationResponse — returned after approve/reject/suspend/reactivate */
export type DoctorModerationResponse = {
  doctorId: string;
  approvalStatus: DoctorApprovalStatus;
  isPubliclyVisible: boolean;
};

/** Maps: AdminDoctorListQuery */
export type AdminDoctorListQuery = {
  approvalStatus?: DoctorApprovalStatus | '';
  city?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

// ─── Patient Moderation ───────────────────────────────────────────────────────

/** Maps: AdminPatientListItem */
export type AdminPatientListItem = {
  userId: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
};

/** Maps: PatientModerationResponse */
export type PatientModerationResponse = {
  userId: string;
  isActive: boolean;
};

// ─── Consultation Monitoring ──────────────────────────────────────────────────

/** Maps: AdminConsultationListItem */
export type AdminConsultationListItem = {
  consultationId: string;
  consultationNumber: string;
  patientName: string;
  doctorName: string;
  specialization: string | null;
  status: string;
  scheduledDate: string;
  startTime: string;
  createdAt: string;
};

/** Maps: ConsultationStatusHistoryItem */
export type ConsultationStatusHistoryItem = {
  newStatus: string;
  oldStatus: string | null;
  reason: string | null;
  changedAt: string;
};

/** Maps: AdminConsultationDetail */
export type AdminConsultationDetail = {
  consultationId: string;
  consultationNumber: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  specialization: string | null;
  status: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  symptoms: string | null;
  cancellationReason: string | null;
  meetingStartedAt: string | null;
  meetingEndedAt: string | null;
  createdAt: string;
  statusHistory: ConsultationStatusHistoryItem[];
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────

/** Maps: AdminAuditLogListItem */
export type AdminAuditLogListItem = {
  id: string;
  adminUserId: string;
  adminFullName: string;
  actionType: string;
  targetEntityType: string;
  targetEntityId: string;
  reason: string | null;
  performedAt: string;
};

// ─── Shared ───────────────────────────────────────────────────────────────────

/** Paginated response envelope from backend PaginatedResponse<T> */
export type PaginatedData<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
