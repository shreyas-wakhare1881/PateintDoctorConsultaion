'use client';

/**
 * Admin Dashboard Page
 * Route: /admin/dashboard
 * Guard: AdminGuard
 *
 * Source of truth:
 *  - backend/Modules/Admin/SDD/APIs.md (#2 Dashboard)
 *  - frontend/SDD/admin.md (#6.2 Admin Dashboard)
 */

import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/guards/admin.guard';
import { useAdminDashboard, useAdminPendingDoctors } from '@/modules/admin/hooks/useAdmin';
import { StatCard, StatGridSkeleton } from '@/components/admin/stat-card';
import { ROUTES } from '@/config/routes';

function AdminDashboardContent() {
  const router = useRouter();
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <StatGridSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Failed to load dashboard stats. Try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform operational overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Total Doctors"
          value={data.totalDoctors}
        />
        <StatCard
          label="Pending Approvals"
          value={data.pendingDoctors}
          variant={data.pendingDoctors > 0 ? 'warning' : 'default'}
          description={data.pendingDoctors > 0 ? 'Requires review' : undefined}
          onClick={() => router.push(ROUTES.admin.doctors)}
        />
        <StatCard
          label="Suspended Doctors"
          value={data.suspendedDoctors}
          variant={data.suspendedDoctors > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Active Patients"
          value={data.totalActivePatients}
        />
        <StatCard
          label="Total Consultations"
          value={data.totalConsultations}
        />
        <StatCard
          label="Completed"
          value={data.completedConsultations}
          variant="success"
        />
        <StatCard
          label="Cancelled"
          value={data.cancelledConsultations}
          variant={data.cancelledConsultations > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Today"
          value={data.todayConsultations}
          description="Consultations scheduled today"
        />
      </div>

      {/* Quick Actions */}
      {data.pendingDoctors > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-amber-900">
                {data.pendingDoctors} Doctor{data.pendingDoctors !== 1 ? 's' : ''} Awaiting Approval
              </h2>
              <p className="mt-0.5 text-sm text-amber-700">
                Review pending doctor applications to unlock their dashboard access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(ROUTES.admin.doctors)}
              className="ml-4 shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Review Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboardContent />
    </AdminGuard>
  );
}

