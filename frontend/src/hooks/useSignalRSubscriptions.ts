'use client';

/**
 * useSignalRSubscriptions — subscribes to SignalR events from the NotificationHub
 * and invalidates React Query caches so the UI stays in sync with backend state.
 *
 * MUST be called inside a component that renders only when authenticated
 * (i.e., inside SocketProvider after hubs are started).
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getNotificationHubConnection } from '@/services/signalr-client';
import { socketConfig } from '@/config/socket.config';

type ConsultationStatusChangedPayload = {
  consultationId: string;
  status: string;
  consultationNumber: string;
  updatedAt: string;
};

export function useSignalRSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const hub = getNotificationHubConnection();

    const handleStatusChanged = (payload: ConsultationStatusChangedPayload) => {
      // Broad invalidation — covers patient list, doctor requests, doctor schedule, detail, admin
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'consultations'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'consultations'] });

      // Targeted invalidation for detail page if open
      if (payload.consultationId) {
        queryClient.invalidateQueries({
          queryKey: ['consultations', 'detail', payload.consultationId],
        });
        queryClient.invalidateQueries({
          queryKey: ['consultations', 'history', payload.consultationId],
        });
      }
    };

    hub.on(socketConfig.events.consultationStatusChanged, handleStatusChanged);

    return () => {
      hub.off(socketConfig.events.consultationStatusChanged, handleStatusChanged);
    };
  }, [queryClient]);
}
