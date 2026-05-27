'use client';

/**
 * ToastProvider — global toast overlay using sonner.
 *
 * Usage anywhere in the app:
 *   import { toast } from 'sonner';
 *   toast.success('Booking confirmed');
 *   toast.error('Something went wrong');
 *   toast.info('New consultation request');
 *
 * Covers:
 *  - Auth errors / session expiry
 *  - API success / error feedback
 *  - Consultation status notifications
 *  - Admin moderation actions
 */

import { Toaster } from 'sonner';

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
        expand={false}
      />
    </>
  );
}
