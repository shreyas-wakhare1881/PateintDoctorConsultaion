'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/auth/brand-mark';

export default function DoctorRejectedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-slate-50 flex flex-col">
      <header className="flex items-center px-6 py-4 max-w-5xl mx-auto w-full">
        <BrandMark size="sm" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.07)] border border-border/60 p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden="true">
                <circle cx="24" cy="24" r="20" fill="#FEE2E2" />
                <path d="M16 16l16 16M32 16L16 32" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
            Application Rejected
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            Application Not Approved
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Unfortunately your doctor registration application was not approved
            at this time. This may be due to incomplete information or
            credential verification issues.
          </p>

          {/* Possible reasons */}
          <div className="bg-red-50/60 rounded-xl p-4 text-left mb-6 space-y-2">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
              Common reasons
            </p>
            {[
              'Incomplete or unverifiable credentials',
              'Documents could not be authenticated',
              'Specialization not currently supported',
            ].map((reason) => (
              <div key={reason} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <p className="text-sm text-muted-foreground">{reason}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="mailto:support@healthconsult.com?subject=Doctor%20Application%20Rejection%20Appeal"
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              Appeal or Contact Support
            </Link>
            <Link
              href="/auth/register"
              className="w-full h-11 rounded-xl border border-border text-sm text-muted-foreground flex items-center justify-center hover:bg-muted/40 transition-colors"
            >
              Re-apply with Updated Info
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
