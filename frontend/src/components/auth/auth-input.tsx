'use client';

/**
 * AuthInput — premium styled input for auth forms.
 * Wraps native <input> with consistent focus ring, error state, disabled state.
 */

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  error?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ error, prefix, suffix, className, style, ...props }, ref) => {
    if (prefix || suffix) {
      return (
        <div
          className={cn(
            'flex h-12 items-center overflow-hidden rounded-xl border',
            'transition-all duration-200',
            error
              ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-400/15'
              : 'border-slate-200 focus-within:border-[#304F6D] focus-within:ring-2 focus-within:ring-[#304F6D]/15',
            props.disabled && 'cursor-not-allowed opacity-50'
          )}
          style={{ background: 'rgba(255,255,255,0.85)' }}
        >
          {prefix && (
            <div className="flex-shrink-0 pl-3.5 pr-1" style={{ color: '#6B7280' }}>
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={cn(
              'h-full flex-1 bg-transparent px-3 text-sm outline-none',
              'disabled:cursor-not-allowed',
              className
            )}
            style={{ color: '#1F2937', ...style } as React.CSSProperties}
          />
          {suffix && (
            <div className="flex-shrink-0 pl-1 pr-3.5" style={{ color: '#6B7280' }}>
              {suffix}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        {...props}
        className={cn(
          'h-12 w-full rounded-xl border px-3.5 text-sm',
          'outline-none',
          'transition-all duration-200',
          error
            ? 'border-red-400 focus:ring-2 focus:ring-red-400/15'
            : 'border-slate-200 focus:border-[#304F6D] focus:ring-2 focus:ring-[#304F6D]/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        style={{ background: 'rgba(255,255,255,0.85)', color: '#1F2937', ...style } as React.CSSProperties}
      />
    );
  }
);
AuthInput.displayName = 'AuthInput';
