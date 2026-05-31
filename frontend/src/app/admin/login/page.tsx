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
import { ROUTES, ROLE_DASHBOARD } from '@/config/routes';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { parseApiError } from '@/utils/errors';
import { credentialLoginSchema, CredentialLoginInput } from '@/modules/auth/schemas/auth.schema';
import { FormField } from '@/components/auth/form-field';
import { AuthInput } from '@/components/auth/auth-input';
import { PasswordInput } from '@/components/auth/password-input';
import { AuthButton } from '@/components/auth/auth-button';
import { SessionLoader } from '@/components/shared/session-loader';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { motion } from 'framer-motion';

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
    if (!isSessionLoading && isAuthenticated && user) {
      router.replace(ROLE_DASHBOARD[user.role] ?? ROUTES.admin.dashboard);
    }
  }, [isAuthenticated, isSessionLoading, user, router]);

  if (isSessionLoading) return <SessionLoader />;
  if (isAuthenticated) return null;

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
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full"
      >
        <AuthCard>
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-sky-50 mb-4">
              <svg className="h-7 w-7 text-ring" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h1 className="text-[1.5rem] font-bold tracking-tight text-foreground leading-tight">
              Admin Portal
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Restricted Portal Access
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField label="" htmlFor="email" error={errors.email?.message}>
              <AuthInput
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                placeholder="Admin email"
                error={!!errors.email}
                {...register('email')}
              />
            </FormField>

            <FormField label="" htmlFor="password" error={errors.password?.message}>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Password"
                error={!!errors.password}
                {...register('password')}
              />
            </FormField>

            <input type="hidden" {...register('role')} />

            {bannerError && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/8 px-3.5 py-2.5 text-xs text-destructive">
                {bannerError}
              </p>
            )}

            <AuthButton
              type="submit"
              disabled={loading}
              loading={loading}
            >
              Access Admin
            </AuthButton>
          </form>
        </AuthCard>
      </motion.div>
    </AuthLayout>
  );
}
