import { env } from './env';

export const API_CONFIG = {
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
} as const;
