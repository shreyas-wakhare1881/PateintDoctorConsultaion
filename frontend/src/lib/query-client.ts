/**
 * Singleton QueryClient
 *
 * Extracted from QueryProvider so that non-React code (auth store, Axios
 * interceptor) can call `queryClient.clear()` on logout — without needing
 * React context or a hook.
 *
 * Both QueryProvider and the auth store import this same instance.
 */

import { QueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/utils/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 30 seconds by default.
      // Individual hooks override per SDD stale time specs.
      staleTime: 30 * 1000,
      // Retry once on failure — but never on client/auth errors.
      retry: (failureCount, error) => {
        const apiError = parseApiError(error);
        if ([401, 403, 404, 409, 422].includes(apiError.status)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
