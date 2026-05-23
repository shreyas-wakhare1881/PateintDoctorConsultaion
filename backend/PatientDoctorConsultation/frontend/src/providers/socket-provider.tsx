'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import * as signalR from '@microsoft/signalr';
import { buildHubConnection } from '@/services/signalr-client';
import { SOCKET_CONFIG } from '@/config/socket.config';
import { useAuthStore } from '@/store/auth.store';

interface SocketContextValue {
  consultationHub: signalR.HubConnection | null;
  notificationHub: signalR.HubConnection | null;
}

const SocketContext = createContext<SocketContextValue>({
  consultationHub: null,
  notificationHub: null,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const consultationHub = useRef<signalR.HubConnection | null>(null);
  const notificationHub = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const cHub = buildHubConnection(SOCKET_CONFIG.consultationHubUrl);
    const nHub = buildHubConnection(SOCKET_CONFIG.notificationHubUrl);

    consultationHub.current = cHub;
    notificationHub.current = nHub;

    cHub.start().catch(console.error);
    nHub.start().catch(console.error);

    return () => {
      cHub.stop();
      nHub.stop();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider
      value={{
        consultationHub: consultationHub.current,
        notificationHub: notificationHub.current,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
