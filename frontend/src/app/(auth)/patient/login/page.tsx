'use client';

/**
 * Patient Login — Primary Entry Point
 * Route: /patient/login
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
import { ROUTES, ROLE_DASHBOARD } from '@/config/routes';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { parseApiError } from '@/utils/errors';
import { patientLoginSchema, PatientLoginInput } from '@/modules/auth/schemas/auth.schema';
import { getAuthError } from '@/config/auth-errors';
import { SessionLoader } from '@/components/shared/session-loader';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAuthAnalytics } from '@/hooks/useAuthAnalytics';

import { AuthCard } from '@/components/auth/auth-card';
import { AuthButton } from '@/components/auth/auth-button';

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
  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
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
    if (!isSessionLoading && isAuthenticated && user) {
      router.replace(ROLE_DASHBOARD[user.role] ?? ROUTES.patient.dashboard);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (isAuthenticated) return null;

  const onSubmit = async (data: PatientLoginInput) => {
    setBannerError(null);
    setLoading(true);
    try {
      const localNumber = data.phoneNumber.replace(/^0+/, '');
      const fullPhone = `${countryCode}${localNumber}`;

      await authService.sendOtp({ phoneNumber: fullPhone });

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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full"
    >
      {/* Card */}
      <AuthCard>

        {/* Header */}
        <div className="mb-6 text-center">
          <div
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4"
            style={{ background: 'rgba(48,79,109,0.12)' }}
          >
            <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
              <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="#304F6D" opacity=".15"/>
              <path d="M6 16h3l2-4 3 8 2-6 2 3 1-1h7" stroke="#304F6D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1
            className="text-[1.55rem] font-bold tracking-tight leading-tight"
            style={{ color: '#1F2937', letterSpacing: '-0.03em', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
          >
            Welcome to HealthConsult
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
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
                className="block text-sm font-semibold mb-2"
                style={{ color: '#1F2937', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
              >
                Mobile Number
                <span style={{ color: '#ef4444', marginLeft: 2 }} aria-hidden="true">*</span>
              </label>

              {/* ── Phone input container ────────────────────────────── */}
              <div
                className={`flex items-stretch rounded-xl border overflow-hidden transition-all duration-200 ${
                  hasError
                    ? 'border-red-400 ring-2 ring-red-400/15'
                    : 'border-slate-200 focus-within:border-[#304F6D] focus-within:ring-2 focus-within:ring-[#304F6D]/15'
                }`}
                style={{ background: '#FFFFFF', height: 48 }}
              >
                {/* Country selector */}
                <div
                  className="relative flex-shrink-0 flex items-center"
                  style={{ borderRight: '1px solid rgba(48,79,109,0.12)' }}
                >
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Country dial code"
                    disabled={loading}
                    className="h-full appearance-none outline-none cursor-pointer pl-3 pr-8 text-sm font-medium"
                    style={{
                      background: 'rgba(241,245,249,0.95)',
                      color: '#1F2937',
                      minWidth: 100,
                      border: 'none',
                    }}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} style={{ background: '#fff', color: '#1F2937' }}>
                        {c.flag}  {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                    viewBox="0 0 16 16" fill="none" aria-hidden="true"
                  >
                    <path d="M4 6l4 4 4-4" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Selected code badge */}
                <div
                  className="flex items-center px-3 text-sm font-bold select-none shrink-0"
                  style={{
                    background: 'rgba(226,243,253,0.80)',
                    color: '#304F6D',
                    borderRight: '1px solid rgba(48,79,109,0.10)',
                  }}
                >
                  {selectedCountry.code}
                </div>

                {/* Phone number input */}
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
                  className="flex-1 min-w-0 px-3 text-sm outline-none disabled:opacity-50"
                  style={{
                    background: 'transparent',
                    color: '#1F2937',
                    border: 'none',
                  }}
                />
              </div>

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
            <AuthButton
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Get OTP
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </AuthButton>
          </div>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-xs text-muted-foreground font-medium">Secure login</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* Trust row */}
        <div className="flex items-center justify-center gap-4 text-xs" style={{ color: '#6B7280' }}>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" style={{ color: '#304F6D' }} viewBox="0 0 12 12" fill="none">
              <path d="M6 1l1.18 2.39 2.64.38-1.91 1.86.45 2.62L6 7l-2.36 1.25.45-2.62L2.18 3.77l2.64-.38L6 1z" fill="currentColor"/>
            </svg>
            256-bit SSL
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" style={{ color: '#304F6D' }} viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            HIPAA-aligned
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" style={{ color: '#304F6D' }} viewBox="0 0 12 12" fill="none">
              <path d="M6 1.5l3.5 2v3c0 2-1.5 3.5-3.5 4C4 10 2.5 8.5 2.5 6.5v-3L6 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Privacy-safe
          </span>
        </div>
      </AuthCard>

      {/* Doctor CTA card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="mt-4 rounded-xl p-4 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(255,255,255,0.70)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.45)',
          boxShadow: '0 4px 16px rgba(48,79,109,0.08)',
        }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: '#000000' }}>Are you a doctor?</p>
          <p className="text-xs mt-0.5" style={{ color: '#000000' }}>
            Join our network of trusted specialists.
          </p>
        </div>
        <Link
          href={ROUTES.doctor.landing}
          className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
          style={{ color: '#E07D54' }}
        >
          Join
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </Link>
      </motion.div>

      {/* Legal footer */}
      <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.62)' }}>
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline underline-offset-2 transition-colors hover:text-black" style={{ color: 'rgba(0, 0, 0, 0.82)' }}>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-black" style={{ color: 'rgba(0, 0, 0, 0.82)' }}>
          Privacy Policy
        </Link>
      </p>
    </motion.div>
  );
}