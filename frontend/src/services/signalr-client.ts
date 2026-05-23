import * as signalR from '@microsoft/signalr';
import { socketConfig } from '@/config/socket.config';
import { useAuthStore } from '@/store/auth.store';

const buildConnection = (hubUrl: string): signalR.HubConnection =>
  new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
    })
    .withAutomaticReconnect(socketConfig.options.reconnectDelays)
    .configureLogging(
      process.env.NODE_ENV === 'development'
        ? signalR.LogLevel.Information
        : signalR.LogLevel.Warning
    )
    .build();

export const consultationHubConnection = buildConnection(
  socketConfig.consultationHub
);

export const notificationHubConnection = buildConnection(
  socketConfig.notificationHub
);
