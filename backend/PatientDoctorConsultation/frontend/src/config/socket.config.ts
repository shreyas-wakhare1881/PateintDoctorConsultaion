import { env } from './env';

export const SOCKET_CONFIG = {
  consultationHubUrl: `${env.signalrUrl}/hubs/consultation`,
  notificationHubUrl: `${env.signalrUrl}/hubs/notification`,
} as const;
