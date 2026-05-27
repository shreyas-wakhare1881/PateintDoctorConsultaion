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

      // Route by doctor approval status
      try {
        const profileRes = await apiClient.get(apiConfig.endpoints.doctors.me);
        const approvalStatus: string = (profileRes.data as { data?: { approvalStatus?: string } })?.data?.approvalStatus ?? 'Pending';

        const statusRoutes: Record<string, string> = {
          Approved: ROUTES.doctor.dashboard,
          Pending: ROUTES.doctor.pending,
          Rejected: ROUTES.doctor.rejected,
          Suspended: ROUTES.doctor.suspended,
        };

        toast.success('Welcome back!');
        router.replace(statusRoutes[approvalStatus] ?? ROUTES.doctor.pending);
      } catch {
        router.replace(ROUTES.doctor.pending);
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
        <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.08)] border border-border/50 p-7 sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-50 mb-4">
              <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7" aria-hidden="true">
                <circle cx="16" cy="10" r="5" fill="hsl(152 60% 38%)" opacity=".15"/>
                <circle cx="16" cy="10" r="5" stroke="hsl(152 60% 38%)" strokeWidth="1.8"/>
                <path d="M6 27c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="hsl(152 60% 38%)" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M20 20h4m-2-2v4" stroke="hsl(152 60% 38%)" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-[1.5rem] font-bold tracking-tight text-foreground leading-tight">
              Doctor Login
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your professional account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Doctor login form" className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email address
                <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="doctor@hospital.com"
                disabled={loading}
                aria-invalid={!!errors.email}
                {...register('email')}
                className={`w-full h-12 rounded-xl border-2 bg-background px-3.5 text-sm outline-none
                  transition-all placeholder:text-muted-foreground/50
                  focus:border-primary focus:ring-2 focus:ring-primary/15
                  disabled:opacity-50
                  ${errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/15' : 'border-border'}`}
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
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                  <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                </label>
                <Link
                  href="mailto:support@healthconsult.com?subject=Password%20Reset"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
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
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
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
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Register CTA */}
          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              New to HealthConsult?{' '}
              <Link
                href={ROUTES.doctor.register}
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Apply as a Doctor
              </Link>
            </p>
          </div>
        </div>

        {/* Patient CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4 rounded-xl border border-border/60 bg-white/70 backdrop-blur-sm p-4 flex items-center justify-between gap-4"
        >
          <p className="text-sm text-muted-foreground">Looking for a doctor?</p>
          <Link
            href={ROUTES.login}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Patient login →
          </Link>
        </motion.div>

        {/* Legal */}
        <p className="mt-5 text-center text-xs text-muted-foreground/60 leading-relaxed">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
