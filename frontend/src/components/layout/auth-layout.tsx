'use client';

/**
 * AuthLayout — centered layout for all auth screens.
 * Source of truth: frontend/SDD/auth.md §3.2
 *
 * Mobile: full-screen gradient. Desktop: centered card on healthcare gradient.
 * Includes: BrandMark, OfflineBanner, legal footer.
 */

import { cn } from '@/utils/cn';
import { BrandMark } from '@/components/auth/brand-mark';
import { OfflineBanner } from '@/components/shared/offline-banner';

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col', className)}>
      {/* Offline detection banner — fixed at top */}
      <OfflineBanner />

      {/* Main centered layout */}
      <div className="flex flex-1 flex-col items-center justify-center auth-gradient px-4 py-8">
        {/* Brand header */}
        <div className="mb-6">
          <BrandMark size="md" />
        </div>

        {/* Page content — slightly wider for desktop breathing room */}
        <div className="w-full max-w-[440px]">
          {children}
        </div>

        {/* Footer — trust + legal */}
        <div className="mt-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} HealthConsult</span>
            <span>·</span>
            <a
              href="/terms"
              className="hover:text-slate-700 transition-colors"
            >
              Terms
            </a>
            <span>·</span>
            <a
              href="/privacy"
              className="hover:text-slate-700 transition-colors"
            >
              Privacy
            </a>
            <span>·</span>
            <a
              href="mailto:support@healthconsult.com"
              className="hover:text-slate-700 transition-colors"
            >
              Support
            </a>
          </div>
          <p className="text-[10px] text-slate-400 text-center">
            Your healthcare data is encrypted and protected.
          </p>
        </div>
      </div>
    </div>
  );
}

