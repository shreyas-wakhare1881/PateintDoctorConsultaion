'use client';

/**
 * Admin Doctors Management Page
 * Route: /admin/doctors
 * Guard: AdminGuard
 *
 * Source of truth:
 *  - backend/Modules/Admin/SDD/APIs.md  (#3 List Pending, #4 List All, #5 Approve, #6 Reject, #7 Suspend, #8 Reactivate)
 *  - frontend/SDD/admin.md (#6.3 Pending Doctors Screen, #6.4 All Doctors Screen)
 *
 * Tabs: Pending | Approved | Rejected | Suspended
 */

import { useState } from 'react';
import { toast } from 'sonner';
import * as Tabs from '@radix-ui/react-tabs';
import { AdminGuard } from '@/guards/admin.guard';
import {
  useAdminPendingDoctors,
  useAdminDoctors,
  useApproveDoctor,
  useRejectDoctor,
  useSuspendDoctor,
  useReactivateDoctor,
} from '@/modules/admin/hooks/useAdmin';
import type { AdminPendingDoctorItem, AdminDoctorListItem, DoctorApprovalStatus } from '@/modules/admin/types/admin.types';
import {
  PendingDoctorCard,
  PendingDoctorCardSkeleton,
  DoctorTableRow,
} from '@/components/admin/doctor-cards';
import {
  ApproveDoctorDialog,
  RejectDoctorDialog,
  SuspendDoctorDialog,
  ReactivateDoctorDialog,
} from '@/components/admin/moderation-dialogs';
import { DoctorStatusBadge } from '@/components/admin/doctor-status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { parseApiError } from '@/utils/errors';

import { PAGINATION } from '@/config/constants';

// ─── Dialog State ──────────────────────────────────────────────────────────────

type DialogType = 'approve' | 'reject' | 'suspend' | 'reactivate' | null;

interface ActiveDialog {
  type: DialogType;
  doctorId: string;
  doctorName: string;
}

// ─── Pending Tab ──────────────────────────────────────────────────────────────

function PendingTab() {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const pageSize = PAGINATION.ADMIN_DEFAULT_PAGE_SIZE;

  const { data, isLoading, isError } = useAdminPendingDoctors(page, pageSize);
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);

  const displayedDoctors: AdminPendingDoctorItem[] = data?.items ?? [];
  const totalCount: number = data?.totalCount ?? 0;
  const totalPages: number = data?.totalPages ?? 1;
  const hasNextPage: boolean = data?.hasNextPage ?? false;
  const hasPreviousPage: boolean = data?.hasPreviousPage ?? false;

  const openDialog = (type: DialogType, doctor: AdminPendingDoctorItem) =>
    setActiveDialog({
      type,
      doctorId: doctor.doctorId,
      doctorName: doctor.fullName,
    });
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

  if (isError) {
    return (
      <EmptyState
        title="Failed to load pending doctors"
        message="Check your connection and try again."
      />
    );
  }

  if (displayedDoctors.length === 0) {
    return (
      <EmptyState
        title="No pending applications"
        message="New doctor submissions will appear here when they are ready for moderation."
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {`${totalCount} application${totalCount !== 1 ? 's' : ''} awaiting review`}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {displayedDoctors.map((doctor) => (
          <PendingDoctorCard
            key={doctor.doctorId}
            doctor={doctor}
            onApprove={() => openDialog('approve', doctor)}
            onReject={() => openDialog('reject', doctor)}
            isApproving={approveMutation.isPending && activeDialog?.doctorId === doctor.doctorId}
            isRejecting={rejectMutation.isPending && activeDialog?.doctorId === doctor.doctorId}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!hasPreviousPage}
            className="rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!hasNextPage}
            className="rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Dialogs */}
      <ApproveDoctorDialog
        open={activeDialog?.type === 'approve'}
        onClose={closeDialog}
        doctorName={activeDialog?.doctorName ?? ''}
        isPending={approveMutation.isPending}
        onConfirm={handleApprove}
      />
      <RejectDoctorDialog
        open={activeDialog?.type === 'reject'}
        onClose={closeDialog}
        doctorName={activeDialog?.doctorName ?? ''}
        isPending={rejectMutation.isPending}
        onConfirm={handleReject}
      />
    </>
  );
}

// ─── All Doctors Tab (Approved / Rejected / Suspended) ────────────────────────

function DoctorListTab({ status }: { status: Exclude<DoctorApprovalStatus, 'Pending'> }) {
  const [page, setPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const pageSize = PAGINATION.ADMIN_DEFAULT_PAGE_SIZE;

  const params = { approvalStatus: status, page, pageSize };
  const { data, isLoading, isError } = useAdminDoctors(params as Record<string, unknown>);
  const approveMutation = useApproveDoctor();
  const rejectMutation = useRejectDoctor();
  const suspendMutation = useSuspendDoctor();
  const reactivateMutation = useReactivateDoctor();
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);

  const doctors: AdminDoctorListItem[] = data?.items ?? [];
  const totalCount: number = data?.totalCount ?? 0;
  const totalPages: number = data?.totalPages ?? 1;
  const hasNextPage: boolean = data?.hasNextPage ?? false;
  const hasPreviousPage: boolean = data?.hasPreviousPage ?? false;

  const openDialog = (type: DialogType, doctor: AdminDoctorListItem) =>
    setActiveDialog({ type, doctorId: doctor.doctorId, doctorName: doctor.fullName });
  const closeDialog = () => setActiveDialog(null);

  const handleAction = async (reason: string) => {
    if (!activeDialog) return;
    const { type, doctorId, doctorName } = activeDialog;
    try {
      if (type === 'suspend') {
        await suspendMutation.mutateAsync({ doctorId, reason });
        toast.success(`${doctorName} suspended.`);
      } else if (type === 'reactivate') {
        await reactivateMutation.mutateAsync({ doctorId, reason: reason || undefined });
        toast.success(`${doctorName} reactivated.`);
      } else if (type === 'approve') {
        await approveMutation.mutateAsync({ doctorId, reason: reason || undefined });
        toast.success(`${doctorName} approved.`);
      } else if (type === 'reject') {
        await rejectMutation.mutateAsync({ doctorId, reason });
        toast.success(`${doctorName} rejected.`);
      }
      closeDialog();
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Action failed.');
    }
  };

  const isPendingAny =
    suspendMutation.isPending ||
    reactivateMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState title="Failed to load doctors" message="Check your connection and try again." />
    );
  }

  if (doctors.length === 0) {
    return (
      <EmptyState title={`No ${status.toLowerCase()} doctors`} message="Nothing to show here." />
    );
  }

  return (
    <>
      <p className="mb-3 text-sm text-muted-foreground">{totalCount} doctor{totalCount !== 1 ? 's' : ''}</p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specialization</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doctor) => (
              <DoctorTableRow
                key={doctor.doctorId}
                doctor={doctor}
                onSuspend={status === 'Approved' ? (id) => openDialog('suspend', doctor) : undefined}
                onReactivate={status === 'Suspended' ? (id) => openDialog('reactivate', doctor) : undefined}
                onApprove={status === 'Rejected' ? (id) => openDialog('approve', doctor) : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!hasPreviousPage}
            className="rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={!hasNextPage}
            className="rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Dialogs */}
      <SuspendDoctorDialog
        open={activeDialog?.type === 'suspend'}
        onClose={closeDialog}
        doctorName={activeDialog?.doctorName ?? ''}
        isPending={suspendMutation.isPending}
        onConfirm={handleAction}
      />
      <ReactivateDoctorDialog
        open={activeDialog?.type === 'reactivate'}
        onClose={closeDialog}
        doctorName={activeDialog?.doctorName ?? ''}
        isPending={reactivateMutation.isPending}
        onConfirm={handleAction}
      />
      <ApproveDoctorDialog
        open={activeDialog?.type === 'approve'}
        onClose={closeDialog}
        doctorName={activeDialog?.doctorName ?? ''}
        isPending={approveMutation.isPending}
        onConfirm={handleAction}
      />
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const TABS: { value: DoctorApprovalStatus; label: string }[] = [
  { value: 'Pending', label: 'Pending Approvals' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Suspended', label: 'Suspended' },
];

function AdminDoctorsContent() {
  const [activeTab, setActiveTab] = useState<DoctorApprovalStatus>('Pending');
  // Badge count for pending tab
  const { data: pendingData } = useAdminPendingDoctors();
  const pendingCount = pendingData?.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Doctor Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review, approve, reject, suspend and reactivate doctor accounts.
        </p>
      </div>

      <Tabs.Root value={activeTab} onValueChange={(v) => setActiveTab(v as DoctorApprovalStatus)}>
        <Tabs.List className="flex gap-1 rounded-xl border bg-muted/40 p-1">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {tab.label}
              {tab.value === 'Pending' && pendingCount > 0 && (
                <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="mt-6">
          <Tabs.Content value="Pending" forceMount className="data-[state=inactive]:hidden">
            <PendingTab />
          </Tabs.Content>
          <Tabs.Content value="Approved" forceMount className="data-[state=inactive]:hidden">
            <DoctorListTab status="Approved" />
          </Tabs.Content>
          <Tabs.Content value="Rejected" forceMount className="data-[state=inactive]:hidden">
            <DoctorListTab status="Rejected" />
          </Tabs.Content>
          <Tabs.Content value="Suspended" forceMount className="data-[state=inactive]:hidden">
            <DoctorListTab status="Suspended" />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}

export default function AdminDoctorsPage() {
  return (
    <AdminGuard>
      <AdminDoctorsContent />
    </AdminGuard>
  );
}

