/**
 * Dashboard route group layout.
 * Source of truth: frontend/SDD/*.md — Route Structure tables
 *
 * Wraps all /patient/*, /doctor/*, /admin/* routes in DashboardLayout.
 * Each sub-route applies its own role guard (PatientGuard, DoctorGuard, AdminGuard).
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
