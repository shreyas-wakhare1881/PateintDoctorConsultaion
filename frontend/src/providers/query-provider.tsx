'use client';

/**
 * QueryProvider — TanStack Query global setup.
 * Uses the shared singleton queryClient so the auth store can call
 * `queryClient.clear()` on logout without needing React context.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

