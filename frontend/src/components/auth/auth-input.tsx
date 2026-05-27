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
  ({ error, prefix, suffix, className, ...props }, ref) => {
    if (prefix || suffix) {
      return (
        <div
          className={cn(
            'flex h-12 items-center overflow-hidden rounded-xl border-2 bg-background',
            'transition-all duration-150',
            error
              ? 'border-destructive focus-within:ring-2 focus-within:ring-destructive/20'
              : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
            props.disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {prefix && (
            <div className="flex-shrink-0 pl-3.5 pr-1 text-muted-foreground">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={cn(
              'h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/60',
              'disabled:cursor-not-allowed',
              className
            )}
          />
          {suffix && (
            <div className="flex-shrink-0 pl-1 pr-3.5 text-muted-foreground">
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
          'h-12 w-full rounded-xl border-2 bg-background px-3.5 text-sm',
          'outline-none placeholder:text-muted-foreground/60',
          'transition-all duration-150',
          error
            ? 'border-destructive focus:ring-2 focus:ring-destructive/20'
            : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
    );
  }
);
AuthInput.displayName = 'AuthInput';
