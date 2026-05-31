'use client';

/**
 * AuthCard — premium card wrapper for all auth screens.
 * Soft shadow, rounded corners, subtle border.
 */

import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn('w-full max-w-[440px] rounded-2xl p-7 sm:p-8 transition-all duration-300', className)}
      style={{
        background:           'rgba(255,255,255,0.82)',
        backdropFilter:       'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border:               '1px solid rgba(255,255,255,0.55)',
        boxShadow:            '0 12px 48px rgba(48,79,109,0.18), inset 0 1px 0 rgba(255,255,255,0.70)',
      }}
    >
      {children}
    </motion.div>
  );
}
