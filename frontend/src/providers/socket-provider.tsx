'use client';

/**
 * SocketProvider — manages SignalR hub lifecycle tied to auth state.
 *
 * Rules:
 *  1. Connections start ONLY when isAuthenticated becomes true.
 *  2. On logout (isAuthenticated → false), connections are stopped and
 *     singletons are reset via resetHubConnections() so re-login gets
 *     fresh connections (new access token).
 *  3. Async race guard: a `mounted` ref prevents async state updates
 *     after the component has unmounted (StrictMode double-mount safe).
 *  4. Only one start attempt per auth transition — guarded by hub state check.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
  getConsultationHubConnection,
  getNotificationHubConnection,
  resetHubConnections,
} from '@/services/signalr-client';
import * as signalR from '@microsoft/signalr';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated) {
      // Auth dropped — tear down everything so next login gets fresh connections.
      resetHubConnections();
      return () => {
        mountedRef.current = false;
      };
    }

    const consultationHub = getConsultationHubConnection();
    const notificationHub = getNotificationHubConnection();

    const startConnections = async () => {
      try {
        if (
          consultationHub.state === signalR.HubConnectionState.Disconnected
        ) {
          await consultationHub.start();
        }
      } catch {
        // Connection will retry automatically via withAutomaticReconnect.
      }

      if (!mountedRef.current) return; // component unmounted during async start

      try {
        if (
          notificationHub.state === signalR.HubConnectionState.Disconnected
        ) {
          await notificationHub.start();
        }
      } catch {
        // Connection will retry automatically via withAutomaticReconnect.
      }
    };

    startConnections();

    return () => {
      mountedRef.current = false;
      // Stop connections; resetHubConnections is called on next effect run
      // (isAuthenticated === false branch above) to null the singletons.
      consultationHub.stop().catch(() => {});
      notificationHub.stop().catch(() => {});
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
