'use client';

/**
 * AuthSkeleton — loading placeholder for auth form screens.
 * Source of truth: frontend/SDD/auth.md §7 Skeleton States
 *
 * Prevents blank flash while session/data loads.
 * Matches exact height/shape of the login card.
 */

import { cn } from '@/utils/cn';

interface AuthSkeletonProps {
  variant?: 'login' | 'otp' | 'setup';
  className?: string;
}

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-muted/70 animate-pulse',
        className
      )}
      aria-hidden="true"
    />
  );
}

export function AuthSkeleton({ variant = 'login', className }: AuthSkeletonProps) {
  return (
    <div
      className={cn('w-full', className)}
      aria-label="Loading…"
      aria-busy="true"
      role="status"
    >
      <div className="bg-white rounded-2xl border border-border/50 shadow-[0_2px_24px_rgba(0,0,0,0.08)] p-7 sm:p-8">
        {variant === 'login' && (
          <>
            {/* Icon placeholder */}
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-2xl bg-muted/70 animate-pulse" />
            </div>
            {/* Title */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <SkeletonBar className="h-6 w-48" />
              <SkeletonBar className="h-4 w-64" />
            </div>
            {/* Label */}
            <SkeletonBar className="h-4 w-28 mb-2" />
            {/* Input */}
            <SkeletonBar className="h-12 w-full mb-4" />
            {/* Button */}
            <SkeletonBar className="h-12 w-full" />
            {/* Trust row */}
            <div className="mt-5 flex items-center justify-center gap-4">
              <SkeletonBar className="h-3 w-20" />
              <SkeletonBar className="h-3 w-20" />
              <SkeletonBar className="h-3 w-20" />
            </div>
          </>
        )}

        {variant === 'otp' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-2xl bg-muted/70 animate-pulse" />
            </div>
            <div className="flex flex-col items-center gap-2 mb-6">
              <SkeletonBar className="h-6 w-40" />
              <SkeletonBar className="h-4 w-56" />
            </div>
            {/* OTP boxes */}
            <div className="flex justify-center gap-3 mb-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 w-14 rounded-xl bg-muted/70 animate-pulse"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
            <SkeletonBar className="h-4 w-32 mx-auto mb-4" />
            <SkeletonBar className="h-12 w-full" />
          </>
        )}

        {variant === 'setup' && (
          <>
            <div className="flex flex-col items-center gap-2 mb-6">
              <SkeletonBar className="h-6 w-48" />
              <SkeletonBar className="h-4 w-64" />
            </div>
            {/* Fields */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="mb-4">
                <SkeletonBar className="h-4 w-24 mb-2" />
                <SkeletonBar className="h-12 w-full" />
              </div>
            ))}
            <SkeletonBar className="h-12 w-full mt-2" />
          </>
        )}
      </div>
    </div>
  );
}
