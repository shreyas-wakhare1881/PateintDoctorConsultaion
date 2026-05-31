'use client';

/**
 * OtpInput — digit-by-digit OTP input with auto-advance, backspace, and paste support.
 * Length is driven by the `length` prop (default: AUTH_CONSTANTS.OTP_LENGTH = 4).
 *
 * Source of truth for OTP length:
 *   backend/Modules/Auth/Validators/AuthValidators.cs → VerifyOtpRequestValidator
 */

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { cn } from '@/utils/cn';
import { AUTH_CONSTANTS } from '@/config/constants';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  /** Number of OTP digits. Defaults to AUTH_CONSTANTS.OTP_LENGTH (4). */
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  disabled,
  error,
  autoFocus,
  length = AUTH_CONSTANTS.OTP_LENGTH,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focus = (idx: number) => inputRefs.current[idx]?.focus();

  const handleChange = (idx: number, e: ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    onChange(next.join(''));
    if (char && idx < length - 1) focus(idx + 1);
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = '';
        onChange(next.join(''));
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = '';
        onChange(next.join(''));
        focus(idx - 1);
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) focus(idx - 1);
    if (e.key === 'ArrowRight' && idx < length - 1) focus(idx + 1);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    // Focus the next empty box after the pasted content
    const nextIdx = Math.min(pasted.length, length - 1);
    focus(nextIdx);
  };

  return (
    <div className="flex gap-3 sm:gap-4" role="group" aria-label={`${length}-digit OTP input`}>
      {digits.map((digit, idx) => (
        <input
          key={`otp-digit-${idx}`}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          autoFocus={autoFocus && idx === 0}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${idx + 1} of ${length}`}
          className={cn(
            'h-14 w-14 rounded-xl border bg-white text-center text-xl font-bold text-slate-900',
            'transition-all duration-200 outline-none select-none',
            'focus:scale-105 focus:shadow-sm',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-destructive text-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/15'
              : digit
              ? 'border-ring bg-sky-50/30 text-ring focus:border-ring focus:ring-2 focus:ring-ring/15'
              : 'border-slate-200 focus:border-ring focus:ring-2 focus:ring-ring/15'
          )}
        />
      ))}
    </div>
  );
}
