import * as signalR from '@microsoft/signalr';
import { socketConfig } from '@/config/socket.config';
import { useAuthStore } from '@/store/auth.store';

const buildConnection = (hubUrl: string): signalR.HubConnection =>
  new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
    })
    .withAutomaticReconnect([...socketConfig.options.reconnectDelays])
    .configureLogging(
      process.env.NODE_ENV === 'development'
        ? signalR.LogLevel.Information
        : signalR.LogLevel.Warning
    )
    .build();

// Lazy singletons — instantiated only on first client-side access (inside useEffect),
// never at module-load time, which prevents SSR prerender failures.
let _consultationHubConnection: signalR.HubConnection | null = null;
let _notificationHubConnection: signalR.HubConnection | null = null;

export const getConsultationHubConnection = (): signalR.HubConnection => {
  if (!_consultationHubConnection) {
    _consultationHubConnection = buildConnection(socketConfig.consultationHub);
  }
  return _consultationHubConnection;
};

export const getNotificationHubConnection = (): signalR.HubConnection => {
  if (!_notificationHubConnection) {
    _notificationHubConnection = buildConnection(socketConfig.notificationHub);
  }
  return _notificationHubConnection;
};
