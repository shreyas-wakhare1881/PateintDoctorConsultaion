'use client';

/**
 * Admin Pending Doctors Page
 * Route: /admin/doctors/pending
 * Guard: AdminGuard
 *
 * Uses PendingDoctorCard which enforces:
 *  - isProfileCompleted gate (Approve button disabled when false)
 *  - Proper reject / approve dialogs
 * Supports full server-side pagination so all pending doctors are accessible.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { AdminGuard } from '@/guards/admin.guard';
import { useAdminPendingDoctors, useApproveDoctor, useRejectDoctor } from '@/modules/admin/hooks/useAdmin';
import {
  PendingDoctorCard,
  PendingDoctorCardSkeleton,
} from '@/components/admin/doctor-cards';
import {
  ApproveDoctorDialog,
  RejectDoctorDialog,
} from '@/components/admin/moderation-dialogs';
import type { AdminPendingDoctorItem } from '@/modules/admin/types/admin.types';
import { parseApiError } from '@/utils/errors';
import { PAGINATION } from '@/config/constants';

type DialogType = 'approve' | 'reject' | null;

interface ActiveDialog {
  type: DialogType;
  doctorId: string;
  doctorName: string;
}

function PendingDoctorsContent() {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const pageSize = PAGINATION.ADMIN_DEFAULT_PAGE_SIZE;

  const { data, isLoading } = useAdminPendingDoctors(page, pageSize);
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);

  const openDialog = (type: DialogType, doctor: AdminPendingDoctorItem) =>
    setActiveDialog({ type, doctorId: doctor.doctorId, doctorName: doctor.fullName });
  const closeDialog = () => setActiveDialog(null);

  const handleApprove = async (reason: string) => {
    if (!activeDialog) return;
    try {
      await approveMutation.mutateAsync({ doctorId: activeDialog.doctorId, reason: reason || undefined });
      toast.success(`${activeDialog.doctorName} approved successfully.`);
      closeDialog();
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Approval failed.');
    }
  };

  const handleReject = async (reason: string) => {
    if (!activeDialog) return;
    try {
      await rejectMutation.mutateAsync({ doctorId: activeDialog.doctorId, reason });
      toast.success(`${activeDialog.doctorName}'s application rejected.`);
      closeDialog();
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Rejection failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <PendingDoctorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const doctors: AdminPendingDoctorItem[] = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = data?.hasNextPage ?? false;
  const hasPreviousPage = data?.hasPreviousPage ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pending Doctor Approvals</h1>
        {totalCount > 0 && (
          <span className="text-sm text-muted-foreground">
            {totalCount} pending {totalCount === 1 ? 'doctor' : 'doctors'}
          </span>
        )}
      </div>

      {doctors.length === 0 && !isLoading ? (
        <p className="text-muted-foreground">No pending doctor registrations.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d) => (
            <PendingDoctorCard
              key={d.doctorId}
              doctor={d}
              onApprove={() => openDialog('approve', d)}
              onReject={() => openDialog('reject', d)}
              isApproving={approveMutation.isPending && activeDialog?.doctorId === d.doctorId}
              isRejecting={rejectMutation.isPending && activeDialog?.doctorId === d.doctorId}
            />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!hasPreviousPage}
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!hasNextPage}
            className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Approve dialog */}
      <ApproveDoctorDialog
        open={activeDialog?.type === 'approve'}
        doctorName={activeDialog?.doctorName ?? ''}
        onConfirm={handleApprove}
        onClose={closeDialog}
        isPending={approveMutation.isPending}
      />

      {/* Reject dialog */}
      <RejectDoctorDialog
        open={activeDialog?.type === 'reject'}
        doctorName={activeDialog?.doctorName ?? ''}
        onConfirm={handleReject}
        onClose={closeDialog}
        isPending={rejectMutation.isPending}
      />
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
