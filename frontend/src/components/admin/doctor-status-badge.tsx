'use client';

import { cn } from '@/utils/cn';
import type { DoctorApprovalStatus } from '@/modules/admin/types/admin.types';

interface DoctorStatusBadgeProps {
  status: DoctorApprovalStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  DoctorApprovalStatus,
  { label: string; className: string }
> = {
  Pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  Approved: {
    label: 'Approved',
    className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  },
  Rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
  Suspended: {
    label: 'Suspended',
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
  },
};

export function DoctorStatusBadge({ status, className }: DoctorStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
