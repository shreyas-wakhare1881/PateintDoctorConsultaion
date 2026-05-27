'use client';

import { cn } from '@/utils/cn';
import { Spinner } from '@/components/shared/spinner';

interface StatCardProps {
  label: string;
  value: number | string;
  description?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
  className?: string;
}

const VARIANT_CLASSES = {
  default: 'border-border',
  warning: 'border-amber-200 bg-amber-50/50',
  danger: 'border-red-200 bg-red-50/50',
  success: 'border-emerald-200 bg-emerald-50/50',
};

const VALUE_CLASSES = {
  default: 'text-foreground',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  success: 'text-emerald-700',
};

export function StatCard({
  label,
  value,
  description,
  variant = 'default',
  onClick,
  className,
}: StatCardProps) {
  const isClickable = !!onClick;
  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'rounded-xl border bg-card p-5 shadow-sm',
        VARIANT_CLASSES[variant],
        isClickable && 'cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold tabular-nums', VALUE_CLASSES[variant])}>{value}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-sm', className)}>
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
