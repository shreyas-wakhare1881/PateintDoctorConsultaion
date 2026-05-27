'use client';

/**
 * AuthButton — full-width CTA button for auth actions.
 * Loading state disables + shows spinner inline.
 */

import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from '@/components/shared/spinner';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
}

export function AuthButton({
  loading,
  variant = 'primary',
  className,
  children,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'relative flex h-12 w-full items-center justify-center gap-2 rounded-xl',
        'text-sm font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 active:scale-[0.98]',
          'shadow-[0_2px_8px_-2px_hsl(174_62%_37%_/_0.35)]',
        ],
        variant === 'outline' && [
          'border-2 border-primary bg-transparent text-primary',
          'hover:bg-primary/6 active:scale-[0.98]',
        ],
        variant === 'ghost' && [
          'bg-transparent text-foreground hover:bg-muted',
        ],
        className
      )}
    >
      {loading && (
        <Spinner size="sm" className="border-primary-foreground/40 border-t-primary-foreground" />
      )}
      {children}
    </button>
  );
}
