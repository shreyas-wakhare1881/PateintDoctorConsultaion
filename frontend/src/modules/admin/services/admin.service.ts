import type { AdminDashboardDto } from '../types/admin.types';

export const adminService = {
  getPendingVerificationsCount: (dashboard: AdminDashboardDto): number =>
    dashboard.pendingDoctors,
  getConsultationUtilizationRate: (dashboard: AdminDashboardDto): number =>
    dashboard.totalConsultations > 0
      ? Math.round((dashboard.completedConsultations / dashboard.totalConsultations) * 100)
      : 0,
};
