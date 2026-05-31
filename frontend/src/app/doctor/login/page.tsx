'use client';

/**
 * Doctor Login — /doctor/login
 * Source of truth: frontend/SDD/auth.md §5.2
 *
 * Credential login for doctors. Routes by approvalStatus post-auth.
 * Accessible, production-grade, calm professional tone.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import axios from 'axios';
import { ROUTES, ROLE_DASHBOARD } from '@/config/routes';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { apiClient } from '@/services/api-client';
import { apiConfig } from '@/config/api.config';
import { parseApiError } from '@/utils/errors';
import { getAuthError } from '@/config/auth-errors';
import { credentialLoginSchema, CredentialLoginInput } from '@/modules/auth/schemas/auth.schema';
import { PasswordInput } from '@/components/auth/password-input';
import { SessionLoader } from '@/components/shared/session-loader';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAuthAnalytics } from '@/hooks/useAuthAnalytics';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';

export default function DoctorLoginPage() {
  const { isAuthenticated, isSessionLoading, login, user } = useAuthStore();
  const router = useRouter();
  const analytics = useAuthAnalytics();

  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialLoginInput>({
    resolver: zodResolver(credentialLoginSchema),
    defaultValues: { email: '', password: '', role: 'Doctor' },
  });

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated && user) {
      router.replace(ROLE_DASHBOARD[user.role] ?? ROUTES.doctor.dashboard);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (isAuthenticated) return null;

  const onSubmit = async (data: CredentialLoginInput) => {
    setBannerError(null);
    setLoading(true);
    try {
      const res = await authService.login({ ...data, role: 'Doctor' });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { accessToken, refreshToken, user: authUser } = res.data!;
      login(authUser, accessToken, refreshToken);
      analytics.loginSuccess('credential', authUser.id);

      // Route by profile completion first, then approval status
      try {
        const profileRes = await apiClient.get(apiConfig.endpoints.doctors.me);
        const profile = (profileRes.data as { data?: { approvalStatus?: string; isProfileCompleted?: boolean } })?.data;
        const approvalStatus: string = profile?.approvalStatus ?? 'Pending';
        const isProfileCompleted: boolean = profile?.isProfileCompleted ?? false;

        toast.success('Welcome back!');

        // isProfileCompleted=false → must complete setup before anything else
        if (!isProfileCompleted) {
          router.replace(ROUTES.doctor.setup);
          return;
        }

        const statusRoutes: Record<string, string> = {
          Approved: ROUTES.doctor.dashboard,
          Pending: ROUTES.doctor.pending,
          Rejected: ROUTES.doctor.rejected,
          Suspended: ROUTES.doctor.suspended,
        };

        router.replace(statusRoutes[approvalStatus] ?? ROUTES.doctor.pending);
      } catch (profileErr: unknown) {
        // 404 = no Doctor row yet (profile setup not started) → go to setup
        const httpStatus = (profileErr as { response?: { status?: number } })?.response?.status;
        if (httpStatus === 404) {
          toast.success('Welcome! Please complete your profile.');
          router.replace(ROUTES.doctor.setup);
        } else {
          // Any other error (network, 500, etc.) → default to pending as safe fallback
          router.replace(ROUTES.doctor.pending);
        }
      }
    } catch (err) {
      const parsed = parseApiError(err);
      analytics.loginFailed('credential', parsed.code ?? 'UNKNOWN');

      setBannerError(getAuthError(parsed.code, parsed.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
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
              style={{ background: 'rgba(48,79,109,0.10)' }}
            >
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
                <circle cx="16" cy="10" r="5" fill="#304F6D" opacity=".15"/>
                <circle cx="16" cy="10" r="5" stroke="#304F6D" strokeWidth="1.8"/>
                <path d="M6 27c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#304F6D" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M20 20h4m-2-2v4" stroke="#304F6D" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h1
              className="text-[1.5rem] font-bold tracking-tight leading-tight"
              style={{ color: '#1F2937', letterSpacing: '-0.03em', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
            >
              Doctor Login
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
              Sign in to your professional account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Doctor login form" className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: '#1F2937' }}>
                Email address
                <span style={{ color: '#ef4444', marginLeft: 2 }} aria-hidden="true">*</span>
              </label>
              <AuthInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="doctor@hospital.com"
                disabled={loading}
                error={!!errors.email}
                {...register('email')}
              />
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-1.5 text-xs text-destructive flex items-center gap-1"
                  >
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6" opacity=".2"/><path d="M6 3.5v3M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold" style={{ color: '#1F2937' }}>
                  Password
                  <span style={{ color: '#ef4444', marginLeft: 2 }} aria-hidden="true">*</span>
                </label>
                <Link
                  href="mailto:support@healthconsult.com?subject=Password%20Reset"
                  className="text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: '#304F6D' }}
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={loading}
                error={!!errors.password}
                {...register('password')}
              />
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-1.5 text-xs text-destructive flex items-center gap-1"
                  >
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6" opacity=".2"/><path d="M6 3.5v3M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    {errors.password.message}
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
              disabled={loading}
              loading={loading}
            >
              Sign In
            </AuthButton>
          </form>

          {/* Register CTA */}
          <div className="mt-5 text-center">
            <p className="text-sm" style={{ color: '#6B7280' }}>
              New to HealthConsult?{' '}
              <Link
                href={ROUTES.doctor.register}
                className="font-semibold transition-colors hover:opacity-80"
                style={{ color: '#304F6D' }}
              >
                Apply as a Doctor
              </Link>
            </p>
          </div>
        </AuthCard>

        {/* Patient CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4 rounded-xl p-4 flex items-center justify-between gap-4"
          style={{ background: 'rgba(255,255,255,0.70)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.45)', borderRadius: 12 }}
        >
          <p className="text-sm" style={{ color: '#6B7280' }}>Looking for a doctor?</p>
          <Link
            href={ROUTES.login}
            className="text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: '#304F6D' }}
          >
            Patient login →
          </Link>
        </motion.div>

        {/* Legal */}
        <p className="mt-5 text-center text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.62)' }}>
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.82)' }}>Terms</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.82)' }}>Privacy Policy</Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
