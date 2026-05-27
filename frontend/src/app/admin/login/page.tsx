'use client';

/**
 * Admin Login Page
 * Route: /admin/login
 * Source of truth: frontend/SDD/auth.md — Admin must NOT appear publicly
 *
 * Internal system route — no public CTA, no branding emphasis.
 * Uses same CredentialLoginForm with role="Admin".
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { parseApiError } from '@/utils/errors';
import { credentialLoginSchema, CredentialLoginInput } from '@/modules/auth/schemas/auth.schema';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { FormField } from '@/components/auth/form-field';
import { AuthInput } from '@/components/auth/auth-input';
import { PasswordInput } from '@/components/auth/password-input';
import { AuthButton } from '@/components/auth/auth-button';
import { SessionLoader } from '@/components/shared/session-loader';

export default function AdminLoginPage() {
  const { isAuthenticated, isSessionLoading, login, user } = useAuthStore();
  const router = useRouter();
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CredentialLoginInput>({
    resolver: zodResolver(credentialLoginSchema),
    defaultValues: { email: '', password: '', role: 'Admin' },
  });

  useEffect(() => { setValue('role', 'Admin'); }, [setValue]);

  useEffect(() => {
    if (!isSessionLoading && isAuthenticated && user?.role === 'Admin') {
      router.replace(ROUTES.admin.dashboard);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (isAuthenticated && user?.role === 'Admin') return null;

  const onSubmit = async (data: CredentialLoginInput) => {
    setBannerError(null);
    setLoading(true);
    try {
      const res = await authService.login({ ...data, role: 'Admin' });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { accessToken, refreshToken, user: authUser } = res.data!
      login(authUser, accessToken, refreshToken);
      toast.success('Admin session started.');
      router.replace(ROUTES.admin.dashboard);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === 'INVALID_CREDENTIALS') {
        setBannerError('Invalid credentials.');
      } else if (parsed.code === 'ROLE_MISMATCH') {
        setBannerError('This account does not have admin privileges.');
      } else {
        setBannerError(parsed.message ?? 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-800 p-7 shadow-2xl">
        {/* Minimal brand — internal tool */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-white">Admin Portal</div>
            <div className="text-[10px] text-slate-400">Restricted Access</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="" htmlFor="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="Admin email"
              className="h-11 w-full rounded-xl border border-slate-600 bg-slate-700 px-3.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </FormField>

          <FormField label="" htmlFor="password" error={errors.password?.message}>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              className="h-11 w-full rounded-xl border border-slate-600 bg-slate-700 px-3.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </FormField>

          <input type="hidden" {...register('role')} />

          {bannerError && (
            <p className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-xs text-red-400">
              {bannerError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : null}
            Access Admin
          </button>
        </form>
      </div>
    </div>
  );
}
