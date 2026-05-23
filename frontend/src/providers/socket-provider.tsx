'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
  getConsultationHubConnection,
  getNotificationHubConnection,
} from '@/services/signalr-client';
import * as signalR from '@microsoft/signalr';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const consultationHub = getConsultationHubConnection();
    const notificationHub = getNotificationHubConnection();

    const startConnections = async () => {
      try {
        if (
          consultationHub.state ===
          signalR.HubConnectionState.Disconnected
        ) {
          await consultationHub.start();
        }
        if (
          notificationHub.state ===
          signalR.HubConnectionState.Disconnected
        ) {
          await notificationHub.start();
        }
      } catch {
        // connections will auto-reconnect
      }
    };

    startConnections();

    return () => {
      consultationHub.stop();
      notificationHub.stop();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
