'use client';

/**
 * SessionLoader — branded splash shown during session hydration.
 * Displays for ≤1.5s while AuthProvider checks refresh token.
 *
 * Design: calm, minimal, healthcare brand identity.
 * No heavy animation — respects prefers-reduced-motion via CSS.
 */

export function SessionLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      role="status"
      aria-label="Loading HealthConsult"
    >
      <div className="flex flex-col items-center gap-5">
        {/* Teal cross logo */}
        <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-primary session-loader-pulse"
          style={{ boxShadow: '0 2px 16px rgba(34,168,152,0.28)' }}
        >
          <div className="absolute h-[58%] w-[22%] rounded-full bg-white" />
          <div className="absolute h-[22%] w-[58%] rounded-full bg-white" />
        </div>

        {/* Wordmark */}
        <p className="text-[1.05rem] font-bold tracking-tight text-foreground">
          HealthConsult
        </p>

        {/* Thin scanning progress bar */}
        <div className="w-20 h-0.5 rounded-full bg-border overflow-hidden" aria-hidden="true">
          <div className="session-loader-bar h-full w-1/2 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
