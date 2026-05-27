/**
 * Auth route group layout.
 * Source of truth: frontend/SDD/auth.md — Screen Definitions
 *
 * Wraps all /auth/* routes in the centered AuthLayout.
 * Public routes — no guard needed. Individual pages handle
 * redirect-if-already-authenticated via useRoleRedirect hook.
 */

import { AuthLayout } from '@/components/layout/auth-layout';

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}

