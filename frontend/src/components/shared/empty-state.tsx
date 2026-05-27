'use client';

/**
 * EmptyState — illustrated empty state with optional CTA.
 * Usage:
 *   <EmptyState
 *     title="No appointments"
 *     message="You haven't booked any consultations yet."
 *     action={{ label: 'Find a Doctor', onClick: () => router.push(ROUTES.patient.doctors) }}
 *   />
 */

import { cn } from '@/utils/cn';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ title, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 text-center',
        className
      )}
    >
      {/* Generic illustration */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <svg
          className="h-10 w-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v.125A1.125 1.125 0 0 0 3.375 19.5m0 0a1.125 1.125 0 0 1 1.125-1.125m15-1.5a1.125 1.125 0 0 1-1.125 1.125m0-1.5v.125m.375-1.875A1.125 1.125 0 0 1 19.5 15m-1.125 3.375v.125a1.125 1.125 0 0 0 1.125 1.125M4.5 4.5h15M4.5 9h15M4.5 13.5h7.5"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {message && (
          <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
        )}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
