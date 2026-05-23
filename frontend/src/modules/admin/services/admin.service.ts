import type { AdminDashboardDto } from '../types/admin.types';

export const adminService = {
  getPendingVerificationsCount: (dashboard: AdminDashboardDto): number =>
    dashboard.pendingDoctorVerifications,
  getConsultationUtilizationRate: (dashboard: AdminDashboardDto): number =>
    dashboard.totalConsultations > 0
      ? Math.round((dashboard.activeConsultations / dashboard.totalConsultations) * 100)
      : 0,
};
