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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'w-full max-w-[420px] rounded-2xl border border-border/60 bg-card',
        'shadow-[0_2px_20px_-6px_rgba(0,0,0,0.08),0_1px_4px_-2px_rgba(0,0,0,0.04)]',
        'p-6 sm:p-8',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
