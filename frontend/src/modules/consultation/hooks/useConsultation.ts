import { useMutation, useQuery } from '@tanstack/react-query';
import { consultationApi } from '../api/consultation.api';
import { useConsultationStore } from '@/store/consultation.store';

export const useBookConsultation = () =>
  useMutation({ mutationFn: consultationApi.book });

export const useConsultationRoom = (id: string) =>
  useQuery({
    queryKey: ['consultation', 'room', id],
    queryFn: () => consultationApi.getRoom(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useGenerateSummary = (id: string) =>
  useMutation({
    mutationFn: (data: unknown) => consultationApi.generateSummary(id, data),
  });

export const useCallControls = () => {
  const { toggleMic, toggleCamera, endCall, isMicMuted, isCameraOff } =
    useConsultationStore();
  return { toggleMic, toggleCamera, endCall, isMicMuted, isCameraOff };
};
