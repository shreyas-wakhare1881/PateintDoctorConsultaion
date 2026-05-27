/**
 * Global loading UI — shown during Next.js route transitions.
 */

import { SessionLoader } from '@/components/shared/session-loader';

export default function GlobalLoading() {
  return <SessionLoader />;
}
