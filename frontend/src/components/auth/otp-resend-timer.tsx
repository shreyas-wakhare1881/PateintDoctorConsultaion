'use client';

/**
 * OtpResendTimer — countdown + resend button.
 *
 * Architecture:
 *  - Single stable setInterval for the entire countdown (NOT one per tick).
 *  - Parent passes `resetSignal` (incremented integer) to restart after a
 *    successful resend — NO component remounting / key-forcing needed.
 *  - React StrictMode safe: cleanup runs before the second mount in dev,
 *    so the interval is always fresh.
 *
 * DO NOT render this with key={someCounter} — use resetSignal instead.
 * Using key forces an unmount/remount which causes the duplicate-key React
 * error when the parent has another sibling element starting at key=0.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

interface OtpResendTimerProps {
  onResend: () => void;
  loading?: boolean;
  initialSeconds?: number;
  /**
   * Increment this value from the parent to restart the countdown.
   * Avoids force-remounting (key prop) which creates duplicate-key errors
   * when a sibling also uses a numeric key starting at 0.
   */
  resetSignal?: number;
}

export function OtpResendTimer({
  onResend,
  loading = false,
  initialSeconds = 300,
  resetSignal = 0,
}: OtpResendTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Start a fresh countdown. Clears any existing interval first. */
  const startCountdown = useCallback(
    (from: number) => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setSeconds(from);
      if (from <= 0) return;

      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            // Interval self-terminates at zero — no dependency on external state.
            if (intervalRef.current !== null) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [] // no deps — uses ref and functional setState, both stable
  );

  // ── Mount: start initial countdown ────────────────────────────────────────
  useEffect(() => {
    startCountdown(initialSeconds);
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only on mount

  // ── resetSignal: restart countdown after parent confirms a successful resend
  // Skip value 0 — that is the initial value, mount effect handles the first start.
  useEffect(() => {
    if (resetSignal === 0) return;
    startCountdown(initialSeconds);
  }, [resetSignal, initialSeconds, startCountdown]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const canResend = seconds === 0 && !loading;

  return (
    <div className="flex items-center justify-center gap-1.5 text-sm">
      {seconds > 0 ? (
        <span className="text-muted-foreground">
          Resend OTP in{' '}
          <span className="font-mono font-semibold text-primary">
            {mm}:{ss}
          </span>
        </span>
      ) : (
        <button
          type="button"
          onClick={canResend ? onResend : undefined}
          disabled={!canResend}
          className={cn(
            'font-medium transition-colors',
            canResend
              ? 'text-primary hover:text-primary/80 underline-offset-2 hover:underline'
              : 'text-muted-foreground cursor-not-allowed'
          )}
        >
          {loading ? 'Sending…' : 'Resend OTP'}
        </button>
      )}
    </div>
  );
}
