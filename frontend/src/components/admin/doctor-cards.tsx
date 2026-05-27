'use client';

import { cn } from '@/utils/cn';
import type { AdminPendingDoctorItem, AdminDoctorListItem } from '@/modules/admin/types/admin.types';
import { DoctorStatusBadge } from './doctor-status-badge';

// ─── Pending Doctor Card (for the pending queue) ──────────────────────────────

interface PendingDoctorCardProps {
  doctor: AdminPendingDoctorItem;
  onApprove: (doctorId: string) => void;
  onReject: (doctorId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  className?: string;
}

export function PendingDoctorCard({
  doctor,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  className,
}: PendingDoctorCardProps) {
  const submittedDate = new Date(doctor.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
        !doctor.isProfileCompleted && 'border-amber-200 bg-amber-50/30',
        className
      )}
    >
      {/* Incomplete profile warning banner */}
      {!doctor.isProfileCompleted && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-800">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          Profile incomplete — doctor has not filled in professional details yet.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{doctor.fullName}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {doctor.specialization ?? <span className="italic text-amber-600">Specialization not set</span>}
          </p>
        </div>
        <DoctorStatusBadge status="Pending" className="shrink-0" />
      </div>

      {/* Details grid */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate font-medium">{doctor.email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Qualification</dt>
          <dd className="truncate font-medium">{doctor.qualification ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">License No.</dt>
          <dd className="truncate font-medium font-mono text-xs">{doctor.licenseNumber ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Experience</dt>
          <dd className="font-medium">
            {doctor.experienceYears != null ? `${doctor.experienceYears} yrs` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">City</dt>
          <dd className="font-medium">{doctor.city ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Profile</dt>
          <dd className="font-medium">
            {doctor.isProfileCompleted ? (
              <span className="text-emerald-600">Complete</span>
            ) : (
              <span className="text-amber-600">Incomplete</span>
            )}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">Submitted {submittedDate}</p>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onApprove(doctor.doctorId)}
          disabled={isApproving || isRejecting || !doctor.isProfileCompleted}
          title={!doctor.isProfileCompleted ? 'Cannot approve — doctor has not completed their profile yet' : undefined}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isApproving ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => onReject(doctor.doctorId)}
          disabled={isApproving || isRejecting}
          className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRejecting ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

export function PendingDoctorCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-muted" />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─── All Doctors Table Row ─────────────────────────────────────────────────────

interface DoctorTableRowProps {
  doctor: AdminDoctorListItem;
  onSuspend?: (doctorId: string) => void;
  onReactivate?: (doctorId: string) => void;
  onApprove?: (doctorId: string) => void;
  onReject?: (doctorId: string) => void;
}

export function DoctorTableRow({
  doctor,
  onSuspend,
  onReactivate,
  onApprove,
  onReject,
}: DoctorTableRowProps) {
  const joinedDate = new Date(doctor.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <tr className="border-b last:border-0 hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-foreground">{doctor.fullName}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{doctor.email ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{doctor.specialization ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{doctor.city ?? '—'}</td>
      <td className="px-4 py-3">
        <DoctorStatusBadge status={doctor.approvalStatus} />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{joinedDate}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {doctor.approvalStatus === 'Pending' && (
            <>
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(doctor.doctorId)}
                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                >
                  Approve
                </button>
              )}
              {onReject && (
                <button
                  type="button"
                  onClick={() => onReject(doctor.doctorId)}
                  className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  Reject
                </button>
              )}
            </>
          )}
          {doctor.approvalStatus === 'Approved' && onSuspend && (
            <button
              type="button"
              onClick={() => onSuspend(doctor.doctorId)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Suspend
            </button>
          )}
          {doctor.approvalStatus === 'Suspended' && onReactivate && (
            <button
              type="button"
              onClick={() => onReactivate(doctor.doctorId)}
              className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Reactivate
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
