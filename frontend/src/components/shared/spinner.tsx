'use client';

/**
 * Spinner — animated loading indicator.
 * Usage: <Spinner size="md" />
 */

import { cn } from '@/utils/cn';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-muted border-t-primary',
        SIZE_MAP[size],
        className
      )}
    />
  );
}
