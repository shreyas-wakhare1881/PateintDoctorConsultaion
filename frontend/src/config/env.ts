/**
 * Environment configuration — centralizes all `NEXT_PUBLIC_*` env var reads.
 *
 * Rules:
 *  1. All values are sourced from `.env.local` (never hardcoded in source).
 *  2. In production, required vars must be set — missing vars throw at startup.
 *  3. In development, fallback values are used only for convenience on localhost.
 *  4. NEVER commit `.env.local` to source control.
 *
 * Required env vars (set in `.env.local`):
 *  NEXT_PUBLIC_API_BASE_URL
 *  NEXT_PUBLIC_SIGNALR_HUB_URL
 *  NEXT_PUBLIC_AI_SERVICE_URL
 *  NEXT_PUBLIC_LIVEKIT_URL
 *  NEXT_PUBLIC_APP_NAME
 */

const isProd = process.env.NODE_ENV === 'production';

/**
 * Read a NEXT_PUBLIC env var. In production, throws if the value is missing.
 * In development, returns the provided fallback (localhost convenience default).
 */
const getRequired = (key: string, devFallback: string): string => {
  const value = process.env[key];
  if (!value) {
    if (isProd) {
      throw new Error(
        `[env] Required environment variable "${key}" is not set. ` +
        `Set it in your deployment environment before building for production.`
      );
    }
    return devFallback;
  }
  return value;
};

export const env = {
  apiBaseUrl: getRequired('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:5053'),
  aiServiceUrl: getRequired('NEXT_PUBLIC_AI_SERVICE_URL', 'http://localhost:8000'),
  signalrHubUrl: getRequired('NEXT_PUBLIC_SIGNALR_HUB_URL', 'http://localhost:5053/hubs'),
  liveKitServerUrl: getRequired('NEXT_PUBLIC_LIVEKIT_URL', 'ws://localhost:7880'),
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'HealthConsult',
  isDev: process.env.NODE_ENV === 'development',
} as const;
