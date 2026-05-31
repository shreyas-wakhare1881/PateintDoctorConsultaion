'use client';

/**
 * OfflineBanner — sticky top banner when network is unavailable.
 * Source of truth: frontend/SDD/auth.md §9 Network Recovery
 *
 * Listens to browser online/offline events. Auto-dismisses on reconnect.
 * Healthcare-safe messaging: calm, no panic, clear CTA.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    // Initialize from current browser state
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      // Clear reconnect message after 3s
      setTimeout(() => setJustReconnected(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(isOffline || justReconnected) && (
        <motion.div
          key={isOffline ? 'offline' : 'reconnected'}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div
            className={`flex items-center justify-center gap-2.5 px-4 py-2 text-sm font-medium ${
              isOffline
                ? 'text-white'
                : 'text-white'
            }`}
            style={{ background: isOffline ? '#E07D54' : '#899481' }}
          >
            {isOffline ? (
              <>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M7.5 5.5A6 6 0 0113 10M4.5 4A7.5 7.5 0 002.5 9M6.5 8a2 2 0 012.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                No internet connection. Check your network and try again.
              </>
            ) : (
              <>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                You're back online!
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
