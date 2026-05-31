'use client';

/**
 * Doctor Pending Approval Screen
 * Route: /doctor/pending
 * Source of truth: frontend/SDD/doctor.md §6.3 Pending Approval Screen
 *
 * - Polls GET /api/doctors/profile/me every 60s
 * - Auto-redirects if status changes to Approved/Rejected/Suspended
 * - Static UI preserved; polling wired via useDoctorPendingPoller
 */

import Link from 'next/link';
import { AuthIllustration } from '@/components/auth/auth-illustration';
import { BrandMark } from '@/components/auth/brand-mark';
import { DoctorGuard } from '@/guards/doctor.guard';
import { useDoctorPendingPoller } from '@/modules/doctor/hooks/useDoctor';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';

function DoctorPendingPageContent() {
  // Wire the polling — auto-redirects when status changes
  useDoctorPendingPoller('Pending');

  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace(ROUTES.doctor.login);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <BrandMark size="sm" />
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign Out
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.07)] border border-border/60 p-8 text-center">
          <div className="flex justify-center mb-6">
            <AuthIllustration type="pending" className="w-32 h-32" />
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(224,125,84,0.12)', color: '#E07D54' }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#E07D54' }} />
            Under Review
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            Application Under Review
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Your doctor registration is being reviewed by our admin team.
            This typically takes <strong>1–2 business days</strong>. We&apos;ll
            notify you once a decision is made.
          </p>

          {/* What happens next */}
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 space-y-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
              What happens next?
            </p>
            {[
              { num: '1', text: 'Admin reviews your credentials & documents' },
              { num: '2', text: 'You receive an email once approved or rejected' },
              { num: '3', text: 'Log in and complete your profile to go live' },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {step.num}
                </span>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            This page automatically checks your status every 60 seconds.
          </p>

          <div className="flex flex-col gap-2">
            <Link
              href={ROUTES.doctor.login}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              Check Status Again
            </Link>
            <Link
              href="mailto:support@healthconsult.com"
              className="w-full h-11 rounded-xl border border-border text-sm text-muted-foreground flex items-center justify-center hover:bg-muted/40 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DoctorPendingPage() {
  return (
    <DoctorGuard>
      <DoctorPendingPageContent />
    </DoctorGuard>
  );
}

