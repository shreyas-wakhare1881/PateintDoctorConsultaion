'use client';

/**
 * SessionExpiredModal — shown when refresh token fails (HTTP 401 on refresh).
 * Source of truth: frontend/SDD/auth.md §8 Session Lifecycle
 *
 * Tone: calm, healthcare-safe. No technical jargon.
 * Auto-redirects to /login after countdown. Forced cleanup before redirect.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_LOGIN, UNAUTHENTICATED_REDIRECT } from '@/config/routes';

const AUTO_REDIRECT_SECONDS = 8;

interface SessionExpiredModalProps {
  open: boolean;
  onClose: () => void;
}


export function SessionExpiredModal({ open, onClose }: SessionExpiredModalProps) {
  const { clearSession, sessionExpiredRole } = useAuthStore();
  const router = useRouter();
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);

  const handleRedirect = useCallback(() => {
    const redirectRole = sessionExpiredRole ?? 'Patient';
    clearSession();
    sessionStorage.removeItem('pdc_otp_phone');
    onClose();
    const loginRoute = ROLE_LOGIN[redirectRole] ?? UNAUTHENTICATED_REDIRECT;
    router.replace(loginRoute);
  }, [clearSession, onClose, router, sessionExpiredRole]);

  // Countdown timer
  useEffect(() => {
    if (!open) {
      setCountdown(AUTO_REDIRECT_SECONDS);
      return;
    }
    if (countdown <= 0) {
      handleRedirect();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, countdown, handleRedirect]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-expired-title"
            aria-describedby="session-expired-desc"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2
              bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] border border-border/50 p-7 text-center"
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-amber-500" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 7v5.5M12 15h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Text */}
            <h2
              id="session-expired-title"
              className="text-lg font-bold text-foreground"
            >
              Your session has expired
            </h2>
            <p
              id="session-expired-desc"
              className="mt-2 text-sm text-muted-foreground leading-relaxed"
            >
              For your security, we periodically sign you out after inactivity.
              You'll need to log in again to continue.
            </p>

            {/* Countdown pill */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              <svg className="h-3 w-3 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              Redirecting in {countdown}s…
            </div>

            {/* CTA */}
            <button
              onClick={handleRedirect}
              className="mt-5 w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
                flex items-center justify-center gap-2
                hover:bg-primary/90 transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              autoFocus
            >
              Log in again
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
