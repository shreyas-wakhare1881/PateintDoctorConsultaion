'use client';

/**
 * OTP Verification — /verify-otp
 * Source of truth: frontend/SDD/auth.md §4.2
 *
 * OTP flow:
 * - 4-digit code (backend VerifyOtpRequestValidator: .Matches(@"^\d{4}$"))
 * - Dev OTP is always "1234" (OtpService.Generate hardcoded in dev)
 * - Auto-submit when all 4 digits entered
 * - Paste support (auto-distributes across boxes)
 * - Shake animation on error
 * - Loading overlay during verification
 * - Resend countdown (5 min = AUTH_CONSTANTS.OTP_TTL_SECONDS)
 * - Retry state tracking
 * - Accessible: aria-live errors, screen reader labels
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';
import { parseApiError } from '@/utils/errors';
import { OtpInput } from '@/components/auth/otp-input';
import { OtpResendTimer } from '@/components/auth/otp-resend-timer';
import { SessionLoader } from '@/components/shared/session-loader';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AUTH_CONSTANTS } from '@/config/constants';
import { getAuthError } from '@/config/auth-errors';
import { useAuthAnalytics } from '@/hooks/useAuthAnalytics';

export default function VerifyOtpPage() {
  const { isAuthenticated, isSessionLoading, login } = useAuthStore();
  const router = useRouter();
  const analytics = useAuthAnalytics();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0); // triggers shake animation
  const [attemptCount, setAttemptCount] = useState(0);
  const autoSubmitRef = useRef(false); // prevent double-submit on auto
  /**
   * Guard against the "already authenticated" redirect effect firing DURING
   * handleVerify's own routing logic. Set to true before calling login() so
   * the effect skips its redirect — handleVerify handles routing itself.
   */
  const didVerifyRef = useRef(false);

  // Read phone + validate OTP session freshness.
  //
  // Redirects to /login if:
  //  - pdc_otp_phone is missing  (user never called send-otp in this tab)
  //  - pdc_otp_sent_at is missing (user navigated to /verify-otp directly)
  //  - elapsed time > OTP TTL    (backend OTP has already expired — skip the round-trip)
  //
  // This prevents the NO_PENDING_OTP / OTP_EXPIRED error in all stale-session cases.
  useEffect(() => {
    const stored    = sessionStorage.getItem('pdc_otp_phone');
    const sentAtRaw = sessionStorage.getItem('pdc_otp_sent_at');

    if (!stored || !sentAtRaw) {
      // No active OTP session — user must request a code via /login first.
      router.replace(ROUTES.login);
      return;
    }

    // Compare elapsed time against the backend OTP TTL (5 min = OTP_TTL_SECONDS).
    // If the window has closed, clear both keys and go back to login so the user
    // immediately sees the "enter your phone" form instead of a confusing error.
    const elapsedMs = Date.now() - parseInt(sentAtRaw, 10);
    if (elapsedMs > AUTH_CONSTANTS.OTP_TTL_SECONDS * 1000) {
      sessionStorage.removeItem('pdc_otp_phone');
      sessionStorage.removeItem('pdc_otp_sent_at');
      router.replace(ROUTES.login);
      return;
    }

    setPhone(stored);
  }, [router]);

  // Redirect if ALREADY authenticated on page load (e.g. user bookmarked /verify-otp).
  // Skip this effect if handleVerify just called login() — it manages its own routing.
  useEffect(() => {
    if (isSessionLoading || didVerifyRef.current) return;
    if (isAuthenticated) {
      router.replace(ROUTES.patient.dashboard);
    }
  }, [isAuthenticated, isSessionLoading, router]);

  const handleVerify = useCallback(async (otpValue: string) => {
    // Guard: phone must be populated from sessionStorage before we can call the backend.
    // Without this, a paste/autofill that fires before the sessionStorage effect completes
    // would send phoneNumber="" and trigger a useless 400 validation error.
    if (otpValue.length !== AUTH_CONSTANTS.OTP_LENGTH || loading || !phone) return;
    setBannerError(null);
    setLoading(true);

    try {
      const res = await authService.verifyOtp({ phoneNumber: phone, otp: otpValue });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { accessToken, refreshToken, user } = res.data!;

      // Mark as verified BEFORE login() to prevent the "already-authenticated"
      // redirect effect from racing with our own profile-check routing below.
      didVerifyRef.current = true;
      login(user, accessToken, refreshToken);
      analytics.loginSuccess('otp', user.id);

      toast.success(`Welcome${user.fullName ? `, ${user.fullName}` : ''}!`, {
        description: 'You are now signed in securely.',
      });
      sessionStorage.removeItem('pdc_otp_phone');
      sessionStorage.removeItem('pdc_otp_sent_at');

      // Check if patient profile exists
      try {
        await apiClient.get(apiConfig.endpoints.patients.me);
        router.replace(ROUTES.patient.dashboard);
      } catch (profileErr) {
        if (axios.isAxiosError(profileErr) && profileErr.response?.status === 404) {
          router.replace(ROUTES.patient.setup);
        } else {
          router.replace(ROUTES.patient.dashboard);
        }
      }
    } catch (err) {
      const parsed = parseApiError(err);
      const newAttempt = attemptCount + 1;
      setAttemptCount(newAttempt);
      setOtp('');
      setShakeKey((k) => k + 1); // trigger shake
      analytics.otpVerifyFailed(parsed.code ?? 'UNKNOWN', newAttempt);

      setBannerError(getAuthError(parsed.code, parsed.message, newAttempt));
    } finally {
      setLoading(false);
      autoSubmitRef.current = false;
    }
  }, [phone, loading, attemptCount, login, analytics, router]);

  // Auto-submit on complete OTP
  useEffect(() => {
    if (otp.length === AUTH_CONSTANTS.OTP_LENGTH && !autoSubmitRef.current && !loading) {
      autoSubmitRef.current = true;
      handleVerify(otp);
    }
  }, [otp, loading, handleVerify]);

  const handleResend = async () => {
    if (!phone) return;
    setResending(true);
    setBannerError(null);
    setOtp('');
    setAttemptCount(0);
    try {
      await authService.sendOtp({ phoneNumber: phone });
      // Refresh the OTP session timestamp so the staleness guard resets to 5 min.
      sessionStorage.setItem('pdc_otp_sent_at', Date.now().toString());
      setTimerKey((k) => k + 1);
      analytics.otpResent(phone);
      toast.success('New OTP sent!', { description: 'Valid for 5 minutes.' });
    } catch (err) {
      const parsed = parseApiError(err);
      toast.error(parsed.message ?? 'Could not resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (isSessionLoading) return <SessionLoader />;
  if (isAuthenticated) return null;

  const maskedPhone = phone
    ? phone.slice(0, -4).replace(/\d/g, '•') + phone.slice(-4)
    : '';

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-border/50 p-7 sm:p-8 relative overflow-hidden">
          {/* Loading overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-white/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 rounded-2xl"
              >
                <div className="h-10 w-10 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Verifying…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
                <path d="M8 4h16v20a4 4 0 01-4 4H8a4 4 0 01-4-4V8a4 4 0 014-4z" fill="hsl(174 62% 37%)" opacity=".12"/>
                <path d="M12 14h8M12 18h5" stroke="hsl(174 62% 37%)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 4v4h4" stroke="hsl(174 62% 37%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="24" r="3" fill="hsl(152 60% 38%)"/>
                <path d="M9 24l.8.8 1.6-1.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-[1.5rem] font-bold tracking-tight text-slate-900 leading-tight">
              Enter your OTP
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              We sent a{' '}
              <span className="font-semibold text-slate-700">{AUTH_CONSTANTS.OTP_LENGTH}-digit code</span>{' '}
              to{' '}
              <span className="font-semibold text-slate-700">{maskedPhone}</span>
            </p>
          </div>

          {/* OTP Input with shake animation */}
          <div className="flex flex-col items-center gap-4">
            {/*
             * key={`shake-${shakeKey}`} — string prefix prevents numeric key collision
             * with any sibling element that also uses a plain integer key starting at 0.
             * Framer Motion restarts the animation when key changes.
             */}
            <motion.div
              key={`shake-${shakeKey}`}
              animate={
                shakeKey > 0
                  ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                  : {}
              }
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <OtpInput
                value={otp}
                onChange={(val) => {
                  setBannerError(null);
                  setOtp(val);
                }}
                disabled={loading}
                error={!!bannerError}
                autoFocus
              />
            </motion.div>

            {/*
             * resetSignal={timerKey} instead of key={timerKey}.
             * key-forcing would cause a duplicate-key error because the sibling
             * motion.div ALSO had a key starting at 0 (shakeKey starts at 0, timerKey
             * starts at 0 → two siblings with key={0} → React "duplicate key" warning).
             * resetSignal is a prop-based restart: OtpResendTimer internally watches
             * for changes to resetSignal and restarts its countdown without remounting.
             */}
            <OtpResendTimer
              resetSignal={timerKey}
              onResend={handleResend}
              loading={resending}
              initialSeconds={AUTH_CONSTANTS.OTP_TTL_SECONDS}
            />
          </div>

          {/* Error banner */}
          <AnimatePresence mode="wait">
            {bannerError && (
              <motion.div
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-4"
              >
                <div className="flex items-start gap-2.5 rounded-xl bg-destructive/8 border border-destructive/20 px-3.5 py-2.5 text-sm text-destructive">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5v3.5M8 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {bannerError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual verify button (for accessibility / keyboard users) */}
          <button
            onClick={() => handleVerify(otp)}
            disabled={loading || otp.length < AUTH_CONSTANTS.OTP_LENGTH}
            aria-busy={loading}
            className="mt-5 w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
              flex items-center justify-center gap-2
              hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            Verify OTP
          </button>
        </div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <Link
            href={ROUTES.login}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Change phone number
          </Link>
        </motion.div>

        {/* Legal footer */}
        <p className="mt-5 text-center text-xs text-slate-500 leading-relaxed">
          Having trouble?{' '}
          <Link href="mailto:support@healthconsult.com" className="underline underline-offset-2 text-slate-600 hover:text-slate-800 transition-colors">
            Contact support
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
