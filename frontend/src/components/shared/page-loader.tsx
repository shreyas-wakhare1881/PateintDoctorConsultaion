'use client';

/**
 * PageLoader — full-page centered spinner for async page transitions.
 * Lighter than SessionLoader (no brand watermark).
 */

import { Spinner } from './spinner';

export function PageLoader() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <Spinner size="lg" />
    </div>
  );
}
