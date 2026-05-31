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
      style={variant === 'primary' ? {
        background: 'linear-gradient(135deg, #E07D54 0%, #d06843 100%)',
        boxShadow: '0 4px 16px rgba(224,125,84,0.35)',
      } : undefined}
      className={cn(
        'relative flex h-12 w-full items-center justify-center gap-2 rounded-xl',
        'text-sm font-semibold transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && [
          'text-white active:scale-[0.98]',
        ],
        variant === 'outline' && [
          'border-2 border-primary bg-transparent text-primary',
          'hover:bg-neutral-50 active:scale-[0.98]',
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
