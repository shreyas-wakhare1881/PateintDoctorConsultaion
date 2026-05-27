'use client';

/**
 * Doctor Suspended Screen
 * Source of truth: frontend/SDD/doctor.md §6.5 Suspended Screen
 * Polls status every 60s — redirects automatically if reactivated.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/auth/brand-mark';
import { DoctorGuard } from '@/guards/doctor.guard';
import { useDoctorPendingPoller } from '@/modules/doctor/hooks/useDoctor';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/config/routes';

function DoctorSuspendedPageContent() {
  useDoctorPendingPoller('Suspended');
  const { logout } = useAuthStore();
  const router = useRouter();
  const handleLogout = () => { logout(); router.replace(ROUTES.doctor.login); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <BrandMark size="sm" />
        <button type="button" onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign Out</button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.07)] border border-border/60 p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
                <circle cx="24" cy="24" r="20" fill="#F1F5F9" />
                <rect x="20" y="14" width="8" height="14" rx="2" fill="#64748B" />
                <rect x="20" y="32" width="8" height="4" rx="2" fill="#64748B" />
              </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full mb-4">
            Account Suspended
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            Your Account Has Been Suspended
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Your doctor account has been suspended by an administrator.
            You cannot access patient consultations until the suspension
            is lifted.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
              What you can do
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Contact our support team with your registered email address to
              understand the reason and request reinstatement if applicable.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="mailto:support@healthconsult.com?subject=Account%20Suspension%20Inquiry"
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="/"
              className="w-full h-11 rounded-xl border border-border text-sm text-muted-foreground flex items-center justify-center hover:bg-muted/40 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DoctorSuspendedPage() {
  return (
    <DoctorGuard>
      <DoctorSuspendedPageContent />
    </DoctorGuard>
  );
}
