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

      {/* Main centered layout with DNA illustration background */}
      <div
        className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8 relative"
        style={{
          background: 'linear-gradient(145deg, #304F6D 0%, #3d6580 30%, #899481 70%, #b0ab9e 100%)',
          backgroundImage: "url('/images/auth_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Navy overlay for energy palette tint */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(145deg, rgba(48,79,109,0.60) 0%, rgba(48,79,109,0.20) 60%, rgba(137,148,129,0.25) 100%)' }}
          aria-hidden="true"
        />
        <div className="flex items-center justify-center w-full">
          {/* Centered Form Pane */}
          <div className="w-full max-w-[440px] flex flex-col items-center">
            {/* Brand header */}
            <div className="mb-6 relative z-10">
              <BrandMark size="md" />
            </div>

            {/* Page content */}
          <div className="w-full relative z-10">
              {children}
            </div>

            {/* Footer — trust + legal */}
            <div className="mt-8 flex flex-col items-center gap-1.5">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs" style={{ color: 'rgba(0, 0, 0, 0.88)', textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)' }}>
                <span>© {new Date().getFullYear()} HealthConsult</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <a href="/terms" className="transition-opacity hover:opacity-100 underline-offset-2 hover:underline" style={{ opacity: 0.78 }}>Terms</a>
                <span style={{ opacity: 0.5 }}>·</span>
                <a href="/privacy" className="transition-opacity hover:opacity-100 underline-offset-2 hover:underline" style={{ opacity: 0.78 }}>Privacy</a>
                <span style={{ opacity: 0.5 }}>·</span>
                <a href="mailto:support@healthconsult.com" className="transition-opacity hover:opacity-100 underline-offset-2 hover:underline" style={{ opacity: 0.78 }}>Support</a>
              </div>
              <p className="text-[10px] text-center" style={{ color: 'rgba(0, 0, 0, 0.68)', textShadow: '0 1px 3px rgba(0,0,0,0.40)' }}>
                Your healthcare data is encrypted and protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

