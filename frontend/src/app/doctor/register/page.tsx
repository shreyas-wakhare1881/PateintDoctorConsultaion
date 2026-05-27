'use client';

/**
 * Doctor Registration — /doctor/register
 * Source of truth: frontend/SDD/auth.md §5.3
 *
 * Fields: fullName, email, phoneNumber (optional), password, confirmPassword
 * Form state persisted to sessionStorage (survives accidental navigation).
 * Password strength meter, terms agreement checkbox.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { authService } from '@/services/auth.service';
import { parseApiError } from '@/utils/errors';
import { getAuthError } from '@/config/auth-errors';
import { doctorRegisterSchema, DoctorRegisterInput } from '@/modules/auth/schemas/auth.schema';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import { AuthIllustration } from '@/components/auth/auth-illustration';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAuthAnalytics } from '@/hooks/useAuthAnalytics';
import { useFormPersistence } from '@/hooks/useFormPersistence';

type FormState = 'form' | 'success';

export default function DoctorRegisterPage() {
  const analytics = useAuthAnalytics();
  const [formState, setFormState] = useState<FormState>('form');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<DoctorRegisterInput>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      role: 'Doctor',
    },
  });

  const { clearPersisted } = useFormPersistence('doctor-register', watch, reset);
  const passwordValue = watch('password');

  // Track registration start
  useEffect(() => {
    analytics.doctorRegistrationStarted();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: DoctorRegisterInput) => {
    if (!agreedToTerms) {
      setBannerError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setBannerError(null);
    setLoading(true);
    try {
      await authService.register({
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        password: data.password,
        confirmPassword: data.confirmPassword,
        role: 'Doctor',
      });
      analytics.doctorRegistrationSubmitted(data.email);
      clearPersisted();
      setFormState('success');
    } catch (err) {
      const parsed = parseApiError(err);
      analytics.doctorRegistrationFailed(parsed.code ?? 'UNKNOWN');

      setBannerError(getAuthError(parsed.code, parsed.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {formState === 'success' ? (
          /* ── Success State ─────────────────────────────────────────────── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="w-full"
          >
            <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-border/50 p-7 sm:p-8 text-center">
              <div className="flex justify-center mb-5">
                <AuthIllustration type="pending" className="w-28 h-28" />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Account Created
              </div>

              <h1 className="text-xl font-bold text-foreground">Almost There!</h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Your account has been created. <strong>One more step:</strong> log in and complete
                your professional profile — your specialization, license number, qualifications,
                and experience — so our admin team can review your application.
              </p>

              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">Next steps</p>
                <ol className="space-y-1 text-xs text-amber-700 list-none">
                  <li>① Log in with your new credentials</li>
                  <li>② Fill in your professional details (license, specialization…)</li>
                  <li>③ Wait for admin approval (1–2 business days)</li>
                </ol>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href={ROUTES.doctor.login}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
                    flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  Login &amp; Complete Profile →
                </Link>
                <Link
                  href={ROUTES.doctor.landing}
                  className="w-full h-11 rounded-xl border border-border text-sm text-muted-foreground
                    flex items-center justify-center hover:bg-muted/40 transition-colors"
                >
                  Back to Doctor Home
                </Link>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── Registration Form ─────────────────────────────────────────── */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-border/50 p-7 sm:p-8">
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-50 mb-4">
                  <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
                    <circle cx="16" cy="11" r="5" stroke="hsl(152 60% 38%)" strokeWidth="1.8"/>
                    <path d="M6 28c0-5.523 4.477-10 10-10" stroke="hsl(152 60% 38%)" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M22 22v6m-3-3h6" stroke="hsl(152 60% 38%)" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h1 className="text-[1.4rem] font-bold tracking-tight text-foreground leading-tight">
                  Apply as a Doctor
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Join our network of verified healthcare professionals
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Doctor registration form" className="space-y-4">
                {/* Full Name */}
                <FieldBlock label="Full Name" htmlFor="fullName" error={errors.fullName?.message} required>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Dr. Priya Sharma"
                    disabled={loading}
                    aria-invalid={!!errors.fullName}
                    {...register('fullName')}
                    className={fieldClass(!!errors.fullName)}
                  />
                </FieldBlock>

                {/* Email */}
                <FieldBlock label="Email address" htmlFor="email" error={errors.email?.message} required>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="doctor@hospital.com"
                    disabled={loading}
                    aria-invalid={!!errors.email}
                    {...register('email')}
                    className={fieldClass(!!errors.email)}
                  />
                </FieldBlock>

                {/* Phone (optional) */}
                <FieldBlock label="Phone Number" htmlFor="phoneNumber" error={errors.phoneNumber?.message} hint="Optional — used for patient communication">
                  <input
                    id="phoneNumber"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    disabled={loading}
                    {...register('phoneNumber')}
                    className={fieldClass(!!errors.phoneNumber)}
                  />
                </FieldBlock>

                {/* Password */}
                <FieldBlock label="Password" htmlFor="password" error={errors.password?.message} required>
                  <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    placeholder="Min 8 chars with uppercase, number & symbol"
                    disabled={loading}
                    error={!!errors.password}
                    {...register('password')}
                  />
                  {passwordValue && (
                    <div className="mt-2">
                      <PasswordStrength password={passwordValue} />
                    </div>
                  )}
                </FieldBlock>

                {/* Confirm Password */}
                <FieldBlock label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
                  <PasswordInput
                    id="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    disabled={loading}
                    error={!!errors.confirmPassword}
                    {...register('confirmPassword')}
                  />
                </FieldBlock>

                {/* Terms checkbox */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary underline underline-offset-2 hover:text-primary/80">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">Privacy Policy</Link>.
                    I confirm that all submitted information is accurate and complete.
                  </label>
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
                  disabled={loading || !agreedToTerms}
                  aria-busy={loading}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
                    flex items-center justify-center gap-2
                    hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                      </svg>
                      Submitting application…
                    </>
                  ) : 'Submit Application'}
                </button>
              </form>

              {/* Sign in CTA */}
              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Already registered?{' '}
                  <Link href={ROUTES.doctor.login} className="font-semibold text-primary hover:text-primary/80 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Persistent form note */}
            <p className="mt-3 text-center text-xs text-muted-foreground/60">
              Your form progress is auto-saved during this session.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fieldClass(hasError: boolean) {
  return `w-full h-12 rounded-xl border-2 bg-background px-3.5 text-sm outline-none
    transition-all placeholder:text-muted-foreground/50
    focus:border-primary focus:ring-2 focus:ring-primary/15
    disabled:opacity-50
    ${hasError ? 'border-destructive focus:border-destructive focus:ring-destructive/15' : 'border-border'}`;
}

function FieldBlock({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
        {hint && <span className="text-muted-foreground font-normal"> — {hint}</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
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
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
