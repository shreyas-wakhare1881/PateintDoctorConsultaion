'use client';

/**
 * AuthErrorBanner — inline error strip for auth-specific errors.
 * Used for: INVALID_OTP, OTP_EXPIRED, INVALID_CREDENTIALS, ACCOUNT_INACTIVE, etc.
 */

import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthErrorBannerProps {
  message: string | null | undefined;
  className?: string;
}

export function AuthErrorBanner({ message, className }: AuthErrorBannerProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-start gap-2.5 rounded-xl border border-destructive/25',
            'bg-destructive/5 px-4 py-3 text-sm text-destructive',
            className
          )}
          role="alert"
        >
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
