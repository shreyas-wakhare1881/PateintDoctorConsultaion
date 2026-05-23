export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api',
  signalrUrl: process.env.NEXT_PUBLIC_SIGNALR_URL ?? 'http://localhost:5000',
  livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL ?? 'ws://localhost:7880',
} as const;
