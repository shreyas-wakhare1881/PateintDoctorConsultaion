'use client';

/**
 * useMobile — returns true when viewport is below mobile breakpoint (768px).
 */

import { useEffect, useState } from 'react';
import { UI_CONSTANTS } from '@/config/constants';

export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      `(max-width: ${UI_CONSTANTS.MOBILE_BREAKPOINT_PX - 1}px)`
    );
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
