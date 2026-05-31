'use client';

import { cn } from '@/utils/cn';
import type { AdminPendingDoctorItem, AdminDoctorListItem } from '@/modules/admin/types/admin.types';
import { DoctorStatusBadge } from './doctor-status-badge';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';

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
      style={{
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(18px) saturate(180%)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.45)',
        boxShadow: '0 8px 32px rgba(48,79,109,0.09)',
        borderRadius: 20,
        padding: 20,
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      }}
      className={cn(className)}
    >
      {/* Incomplete profile warning banner */}
      {!doctor.isProfileCompleted && (
        <div className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold" style={{ background: 'rgba(255,225,160,0.35)', color: '#8a6a00', border: '1px solid rgba(224,158,0,0.20)' }}>
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          Profile incomplete — doctor has not filled in professional details yet.
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <DoctorAvatar
            seed={doctor.doctorId}
            name={doctor.fullName}
            size={52}
            style={{ borderRadius: 14, flexShrink: 0 }}
          />
          <div className="min-w-0">
            <h3 className="truncate font-bold" style={{ color: '#1F2937' }}>{doctor.fullName}</h3>
            <p className="mt-0.5 text-sm" style={{ color: '#6B7280' }}>
              {doctor.specialization ?? <span className="italic" style={{ color: '#E07D54' }}>Specialization not set</span>}
            </p>
          </div>
        </div>
        <DoctorStatusBadge status="Pending" className="shrink-0" />
      </div>

      {/* Details grid */}
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {[
          { label: 'Email',         value: doctor.email ?? '—' },
          { label: 'Qualification', value: doctor.qualification ?? '—' },
          { label: 'License No.',   value: doctor.licenseNumber ?? '—' },
          { label: 'Experience',    value: doctor.experienceYears != null ? `${doctor.experienceYears} yrs` : '—' },
          { label: 'City',          value: doctor.city ?? '—' },
          { label: 'Profile',       value: doctor.isProfileCompleted ? 'Complete' : 'Incomplete', accent: doctor.isProfileCompleted ? 'success' : 'warn' as const },
        ].map((item) => (
          <div key={item.label} className="rounded-lg p-2" style={{ background: 'rgba(48,79,109,0.04)' }}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>{item.label}</dt>
            <dd className="mt-0.5 truncate text-xs font-semibold" style={{ color: 'accent' in item ? (item.accent === 'success' ? '#596550' : '#E07D54') : '#1F2937' }}>{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs" style={{ color: '#6B7280' }}>Submitted {submittedDate}</p>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onApprove(doctor.doctorId)}
          disabled={isApproving || isRejecting || !doctor.isProfileCompleted}
          title={!doctor.isProfileCompleted ? 'Cannot approve — doctor has not completed their profile yet' : undefined}
          className="flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: '#304F6D', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(48,79,109,0.25)' }}
        >
          {isApproving ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => onReject(doctor.doctorId)}
          disabled={isApproving || isRejecting}
          className="flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: 'rgba(239,68,68,0.30)', background: 'rgba(239,68,68,0.07)', color: '#991B1B' }}
        >
          {isRejecting ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

export function PendingDoctorCardSkeleton() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.45)', boxShadow: '0 8px 32px rgba(48,79,109,0.09)', borderRadius: 20, padding: 20 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 animate-pulse rounded-xl" style={{ background: 'rgba(48,79,109,0.09)' }} />
          <div className="h-4 w-28 animate-pulse rounded-xl" style={{ background: 'rgba(48,79,109,0.07)' }} />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full" style={{ background: 'rgba(48,79,109,0.09)' }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: 'rgba(48,79,109,0.06)' }} />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-xl" style={{ background: 'rgba(48,79,109,0.09)' }} />
        <div className="h-9 flex-1 animate-pulse rounded-xl" style={{ background: 'rgba(239,68,68,0.07)' }} />
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
    <tr
      className="transition-colors"
      style={{ borderBottom: '1px solid rgba(48,79,109,0.07)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,225,160,0.15)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <DoctorAvatar
            seed={doctor.doctorId}
            name={doctor.fullName}
            size={36}
            style={{ borderRadius: 10 }}
          />
          <span className="text-sm font-semibold" style={{ color: '#1F2937' }}>{doctor.fullName}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: '#6B7280' }}>{doctor.email ?? '—'}</td>
      <td className="px-4 py-3 text-sm" style={{ color: '#6B7280' }}>{doctor.specialization ?? '—'}</td>
      <td className="px-4 py-3 text-sm" style={{ color: '#6B7280' }}>{doctor.city ?? '—'}</td>
      <td className="px-4 py-3">
        <DoctorStatusBadge status={doctor.approvalStatus} />
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: '#6B7280' }}>{joinedDate}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {doctor.approvalStatus === 'Pending' && (
            <>
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(doctor.doctorId)}
                  className="rounded-xl px-2.5 py-1 text-xs font-bold transition-all hover:opacity-80"
                  style={{ background: '#304F6D', color: '#FFFFFF' }}
                >
                  Approve
                </button>
              )}
              {onReject && (
                <button
                  type="button"
                  onClick={() => onReject(doctor.doctorId)}
                  className="rounded-xl px-2.5 py-1 text-xs font-bold transition-all hover:opacity-80"
                  style={{ background: 'rgba(239,68,68,0.09)', color: '#991B1B', border: '1px solid rgba(239,68,68,0.20)' }}
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
              className="rounded-xl px-2.5 py-1 text-xs font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(107,114,128,0.10)', color: '#4B5563', border: '1px solid rgba(107,114,128,0.20)' }}
            >
              Suspend
            </button>
          )}
          {doctor.approvalStatus === 'Suspended' && onReactivate && (
            <button
              type="button"
              onClick={() => onReactivate(doctor.doctorId)}
              className="rounded-xl px-2.5 py-1 text-xs font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(137,148,129,0.15)', color: '#596550', border: '1px solid rgba(137,148,129,0.25)' }}
            >
              Reactivate
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
