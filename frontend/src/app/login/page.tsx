'use client';

/**
 * Patient Login — Primary Entry Point
 * Route: /login
 * Source of truth: frontend/SDD/auth.md §4.1
 *
 * Patient-first healthcare auth. Mobile-first, frictionless, calming.
 * Flow: phone → OTP → dashboard (or /patient/setup on first login)
 */

import { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { parseApiError } from '@/utils/errors';
import { patientLoginSchema, PatientLoginInput } from '@/modules/auth/schemas/auth.schema';
import { getAuthError } from '@/config/auth-errors';
import { SessionLoader } from '@/components/shared/session-loader';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAuthAnalytics } from '@/hooks/useAuthAnalytics';

// Country codes list — India first, most common markets
const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India',       digits: 10 },
  { code: '+1',   flag: '🇺🇸', name: 'USA',         digits: 10 },
  { code: '+44',  flag: '🇬🇧', name: 'UK',          digits: 10 },
  { code: '+61',  flag: '🇦🇺', name: 'Australia',   digits: 9  },
  { code: '+971', flag: '🇦🇪', name: 'UAE',         digits: 9  },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore',   digits: 8  },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia',    digits: 9  },
] as const;

export default function PatientLoginPage() {
  const { isAuthenticated, isSessionLoading } = useAuthStore();
  const router = useRouter();
  const analytics = useAuthAnalytics();
  const phoneFieldId = useId();

  const [countryCode, setCountryCode] = useState('+91');
  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) ?? COUNTRY_CODES[0];
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<PatientLoginInput>({
    resolver: zodResolver(patientLoginSchema),
    defaultValues: { phoneNumber: '' },
  });

  // Auto-focus phone field on mount
  useEffect(() => {
    setFocus('phoneNumber');
  }, [setFocus]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isSessionLoading && isAuthenticated) {
      router.replace(ROUTES.patient.dashboard);
    }
  }, [isAuthenticated, isSessionLoading, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (isAuthenticated) return null;

  const onSubmit = async (data: PatientLoginInput) => {
    setBannerError(null);
    setLoading(true);
    try {
      // Build E.164: strip any leading zeros from local number, prepend country code.
      const localNumber = data.phoneNumber.replace(/^0+/, '');
      const fullPhone = `${countryCode}${localNumber}`;

      await authService.sendOtp({ phoneNumber: fullPhone });

      // Store both the phone and a client-side send timestamp.
      // The timestamp lets the verify-otp page detect a stale/consumed OTP session
      // without an unnecessary round-trip — if > 5 min have elapsed the page
      // redirects to /login automatically so the user gets a fresh code.
      sessionStorage.setItem('pdc_otp_phone', fullPhone);
      sessionStorage.setItem('pdc_otp_sent_at', Date.now().toString());
      analytics.otpRequested(fullPhone);

      toast.success('OTP sent!', { description: 'Valid for 5 minutes.' });
      router.push(ROUTES.verifyOtp);
    } catch (err) {
      const parsed = parseApiError(err);
      analytics.loginFailed('otp', parsed.code ?? 'UNKNOWN');

      setBannerError(getAuthError(parsed.code, parsed.message));
    } finally {
      setLoading(false);
    }
  };

  const hasError = !!bannerError || !!errors.phoneNumber;

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-border/50 p-7 sm:p-8">

          {/* Header */}
          <div className="mb-6 text-center">
            {/* Healthcare icon pulse */}
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
                <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="hsl(174 62% 37%)" opacity=".12"/>
                <path d="M16 8v8m0 0l4-4m-4 4l-4-4" stroke="hsl(174 62% 37%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 20h8" stroke="hsl(174 62% 37%)" strokeWidth="2" strokeLinecap="round"/>
                {/* Heartbeat line */}
                <path d="M6 16h3l2-4 3 8 2-6 2 3 1-1h7" stroke="hsl(174 62% 37%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-[1.55rem] font-bold tracking-tight text-slate-900 leading-tight">
              Welcome to HealthConsult
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your mobile number to receive a secure OTP
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Patient login form">
            <div className="space-y-4">
              {/* Phone Field */}
              <div>
                <label
                  htmlFor={phoneFieldId}
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Mobile Number
                  <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                </label>

                {/* Country code selector + local number input */}
                <div
                  className={`flex items-stretch h-12 rounded-xl border-2 bg-white overflow-hidden transition-colors
                    ${hasError
                      ? 'border-destructive ring-2 ring-destructive/15'
                      : 'border-slate-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15'
                    }`}
                >
                  {/* Country dropdown — shows flag + dial code */}
                  <div className="relative shrink-0 flex items-center border-r border-slate-200">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      aria-label="Country dial code"
                      className="h-full appearance-none bg-slate-50 pl-3 pr-7 text-sm font-medium text-slate-700
                        outline-none cursor-pointer hover:bg-slate-100 focus:bg-slate-100 transition-colors"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag}  {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    {/* Custom dropdown arrow */}
                    <svg
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
                      viewBox="0 0 16 16" fill="none" aria-hidden="true"
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {/* Dial code badge — read-only visual hint */}
                  <div className="flex items-center px-2.5 text-sm font-semibold text-slate-600 bg-white border-r border-slate-100 select-none shrink-0">
                    {selectedCountry.code}
                  </div>

                  {/* Local number input — digits only */}
                  <input
                    id={phoneFieldId}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel-national"
                    placeholder={`${'0'.repeat(selectedCountry.digits - 1)}1`}
                    disabled={loading}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${phoneFieldId}-error` : undefined}
                    {...register('phoneNumber')}
                    className="flex-1 min-w-0 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400
                      outline-none disabled:opacity-50"
                  />
                </div>

                {/* Inline field error */}
                <AnimatePresence mode="wait">
                  {errors.phoneNumber && (
                    <motion.p
                      id={`${phoneFieldId}-error`}
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-1.5 text-xs text-destructive flex items-center gap-1"
                    >
                      <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
                        <circle cx="6" cy="6" r="6" opacity=".2"/>
                        <path d="M6 3.5v3M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {errors.phoneNumber.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Banner error */}
              <AnimatePresence mode="wait">
                {bannerError && (
                  <motion.div
                    role="alert"
                    aria-live="assertive"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="mt-1 w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
                  flex items-center justify-center gap-2
                  hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Sending OTP…
                  </>
                ) : (
                  <>
                    Get OTP
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-muted-foreground font-medium">Secure login</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 text-primary" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l1.18 2.39 2.64.38-1.91 1.86.45 2.62L6 7l-2.36 1.25.45-2.62L2.18 3.77l2.64-.38L6 1z" fill="currentColor"/>
              </svg>
              256-bit SSL
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 text-primary" viewBox="0 0 12 12" fill="none">
                <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              HIPAA-aligned
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 text-primary" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5l3.5 2v3c0 2-1.5 3.5-3.5 4C4 10 2.5 8.5 2.5 6.5v-3L6 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Privacy-safe
            </span>
          </div>
        </div>

        {/* Doctor CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="mt-4 rounded-xl border border-border/60 bg-white/70 backdrop-blur-sm p-4 flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800">Are you a doctor?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Join our network of trusted specialists.
            </p>
          </div>
          <Link
            href={ROUTES.doctor.landing}
            className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-primary
              hover:text-primary/80 transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            Join
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </Link>
        </motion.div>

        {/* Legal footer */}
        <p className="mt-5 text-center text-xs text-slate-500 leading-relaxed">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 text-slate-600 hover:text-slate-800 transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-2 text-slate-600 hover:text-slate-800 transition-colors">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
