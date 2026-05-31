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
  warning: '',
  danger:  '',
  success: '',
};

const VARIANT_STYLES = {
  default: {},
  warning: { background: 'rgba(224,125,84,0.08)', borderColor: 'rgba(224,125,84,0.25)' },
  danger:  { background: 'rgba(239,68,68,0.08)',  borderColor: 'rgba(239,68,68,0.22)'  },
  success: { background: 'rgba(137,148,129,0.12)', borderColor: 'rgba(137,148,129,0.30)' },
};

const VALUE_CLASSES = {
  default: 'text-foreground',
  warning: '',
  danger:  '',
  success: '',
};

const VALUE_STYLES = {
  default: {},
  warning: { color: '#E07D54' },
  danger:  { color: '#EF4444' },
  success: { color: '#899481' },
};

const GLASS_BASE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(18px) saturate(180%)',
  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.45)',
  boxShadow: '0 8px 32px rgba(48,79,109,0.09)',
  borderRadius: 20,
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
  const overrideStyle: React.CSSProperties = {
    ...GLASS_BASE,
    ...(variant === 'warning' ? { background: 'rgba(255,225,160,0.45)', border: '1px solid rgba(224,158,0,0.20)' } : {}),
    ...(variant === 'danger'  ? { background: 'rgba(239,68,68,0.07)',   border: '1px solid rgba(239,68,68,0.22)' }  : {}),
    ...(variant === 'success' ? { background: 'rgba(137,148,129,0.13)', border: '1px solid rgba(137,148,129,0.28)' } : {}),
  };
  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={cn(
        'p-5',
        isClickable && 'cursor-pointer focus:outline-none',
        className
      )}
      style={{
        ...overrideStyle,
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      }}
      onMouseEnter={isClickable ? (e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.14)'; } : undefined}
      onMouseLeave={isClickable ? (e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.09)'; } : undefined}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>{label}</p>
      <p
        className="mt-2 text-3xl font-bold tabular-nums"
        style={{
          letterSpacing: '-0.04em',
          color: variant === 'warning' ? '#8a6a00'
               : variant === 'danger'  ? '#EF4444'
               : variant === 'success' ? '#596550'
               : '#304F6D',
        }}
      >{value}</p>
      {description && (
        <p className="mt-1 text-xs" style={{ color: '#6B7280' }}>{description}</p>
      )}
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-5', className)} style={{ ...GLASS_BASE }}>
      <div className="h-3 w-20 animate-pulse rounded" style={{ background: 'rgba(48,79,109,0.10)' }} />
      <div className="mt-3 h-8 w-14 animate-pulse rounded" style={{ background: 'rgba(48,79,109,0.10)' }} />
    </div>
  );
}

export function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
