'use client';

import { AdminGuard } from '@/guards/admin.guard';
import { useAdminPendingDoctors, useApproveDoctor, useRejectDoctor } from '@/modules/admin/hooks/useAdmin';
import { Spinner } from '@/components/shared/spinner';
import type { AdminPendingDoctorItem } from '@/modules/admin/types/admin.types';

function PendingDoctorsContent() {
  const { data, isLoading } = useAdminPendingDoctors();
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const doctors: AdminPendingDoctorItem[] = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pending Doctor Approvals</h1>

      {doctors.length === 0 ? (
        <p className="text-muted-foreground">No pending doctor registrations.</p>
      ) : (
        <div className="grid gap-4">
          {doctors.map((d) => (
            <div key={d.doctorId} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{d.fullName}</p>
                  <p className="text-sm text-muted-foreground">{d.specialization ?? 'No specialization'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.qualification} • {d.experienceYears ?? '?'} yrs • {d.city ?? 'N/A'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    License: {d.licenseNumber ?? 'Not provided'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate({ doctorId: d.doctorId })}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    disabled={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate({ doctorId: d.doctorId, reason: 'Does not meet criteria' })}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDoctorsPendingPage() {
  return (
    <AdminGuard>
      <PendingDoctorsContent />
    </AdminGuard>
  );
}
