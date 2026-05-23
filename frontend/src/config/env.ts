export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000',
  aiServiceUrl: process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? 'http://localhost:8000',
  signalrHubUrl: process.env.NEXT_PUBLIC_SIGNALR_HUB_URL ?? 'http://localhost:5000/hubs',
  liveKitServerUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL ?? 'ws://localhost:7880',
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'PatientDoctorConsultation',
  isDev: process.env.NODE_ENV === 'development',
} as const;
