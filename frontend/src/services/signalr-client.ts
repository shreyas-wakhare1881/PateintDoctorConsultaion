/**
 * SignalR Client — lazy singletons with auth token injection.
 *
 * Design decisions:
 *  - Connections are lazy: only instantiated on first client-side access inside
 *    a useEffect, never at module-load time (prevents SSR failures).
 *  - `resetHubConnections()` nulls both singletons so that fresh connections
 *    (with updated access tokens) are created after logout + re-login.
 *    Called by SocketProvider cleanup when auth state drops to false.
 *  - `accessTokenFactory` always reads the current token from the store at
 *    connection time and on every reconnect — no stale token issue.
 */

import * as signalR from '@microsoft/signalr';
import { socketConfig } from '@/config/socket.config';
import { useAuthStore } from '@/store/auth.store';

const buildConnection = (hubUrl: string): signalR.HubConnection =>
  new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      // Read the live token from the store on every connection / reconnect attempt.
      accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
    })
    .withAutomaticReconnect([...socketConfig.options.reconnectDelays])
    .configureLogging(
      process.env.NODE_ENV === 'development'
        ? signalR.LogLevel.Warning   // reduce noise in dev
        : signalR.LogLevel.None
    )
    .build();

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

/**
 * Stop both hub connections and null the singletons.
 * MUST be called on logout so that the next auth session creates fresh
 * connections with the new access token instead of reusing stopped ones.
 */
export const resetHubConnections = (): void => {
  _consultationHubConnection?.stop().catch(() => {});
  _notificationHubConnection?.stop().catch(() => {});
  _consultationHubConnection = null;
  _notificationHubConnection = null;
};
