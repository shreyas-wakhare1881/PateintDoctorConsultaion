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
      <div className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 space-y-6" style={{ background: '#E6E1DD', minHeight: '100%' }}>
        <div>
          <div className="h-7 w-48 animate-pulse rounded-xl" style={{ background: 'rgba(48,79,109,0.10)' }} />
          <div className="mt-2 h-4 w-64 animate-pulse rounded-xl" style={{ background: 'rgba(48,79,109,0.07)' }} />
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
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10 space-y-6"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", letterSpacing: '-0.01em' }}
    >
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.03em' }}>Admin Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Platform operational overview</p>
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

      {/* Pending approvals alert */}
      {data.pendingDoctors > 0 && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl p-5"
          style={{ background: 'rgba(255,225,160,0.35)', border: '1px solid rgba(224,158,0,0.22)', backdropFilter: 'blur(12px)' }}
        >
          <div>
            <h2 className="font-bold" style={{ color: '#8a6a00' }}>
              {data.pendingDoctors} Doctor{data.pendingDoctors !== 1 ? 's' : ''} Awaiting Approval
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: '#a07000' }}>
              Review pending doctor applications to unlock their dashboard access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(ROUTES.admin.doctors)}
            className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90"
            style={{ background: '#E07D54', color: '#000000', boxShadow: '0 4px 12px rgba(224,125,84,0.30)' }}
          >
            Review Now
          </button>
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

