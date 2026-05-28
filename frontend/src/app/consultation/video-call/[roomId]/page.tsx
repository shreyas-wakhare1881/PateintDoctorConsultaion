'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { RoomAudioRenderer } from '@livekit/components-react';
import { LiveKitRoom } from '@livekit/components-react';
import { useAuthStore } from '@/store/auth.store';
import { useConsultationStore } from '@/store/consultation.store';
import { ROLE_DASHBOARD, ROUTES } from '@/config/routes';
import { env } from '@/config/env';
import { EmptyState } from '@/components/shared/empty-state';
import { Spinner } from '@/components/shared/spinner';
import {
  useCompleteConsultation,
  useConsultationById,
  useConsultationVideoToken,
} from '@/modules/consultation/hooks/useConsultation';
import { ConsultationRoom } from '@/components/consultation/ConsultationRoom';
import { toast } from 'sonner';
import { parseApiError } from '@/utils/errors';

// ── Main content component ────────────────────────────────────────────────────
function VideoCallContent() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();

  const consultationId = searchParams.get('consultationId') ?? '';
  const routeRoomId = params?.roomId ?? '';

  const { isAuthenticated, isSessionLoading, user } = useAuthStore();
  const { endCall } = useConsultationStore();
  const completeMutation = useCompleteConsultation();
  const [isCompleting, setIsCompleting] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSessionLoading) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.login);
      return;
    }
    if (user && user.role !== 'Patient' && user.role !== 'Doctor') {
      router.replace(ROLE_DASHBOARD[user.role]);
    }
  }, [isAuthenticated, isSessionLoading, router, user]);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const consultationQuery = useConsultationById(consultationId);

  const isVideoAndJoinable =
    !!consultationId &&
    consultationQuery.data?.consultationType === 'Video' &&
    (consultationQuery.data?.status === 'Confirmed' || consultationQuery.data?.status === 'InProgress');

  const videoTokenQuery = useConsultationVideoToken(consultationId, isVideoAndJoinable);

  // ── Disconnect / Leave callback ─────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    endCall();
    const backRoute = user?.role === 'Doctor'
      ? ROUTES.doctor.consultationDetail(consultationId)
      : ROUTES.patient.consultationDetail(consultationId);
    router.replace(backRoute);
  }, [endCall, user, consultationId, router]);

  // ── Complete consultation (Doctor only) ─────────────────────────────────────
  const handleComplete = useCallback(async (notes?: string) => {
    if (!consultationId) return;
    setIsCompleting(true);
    try {
      await completeMutation.mutateAsync({ id: consultationId, notes });
      toast.success('Consultation completed successfully.');
      endCall();
      router.replace(ROUTES.doctor.consultationDetail(consultationId));
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to complete consultation.');
    } finally {
      setIsCompleting(false);
    }
  }, [consultationId, completeMutation, endCall, router]);

  // ── Loading states ───────────────────────────────────────────────────────────
  if (isSessionLoading || consultationQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  // ── Guard: consultation ID missing ──────────────────────────────────────────
  if (!consultationId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState
          title="Missing consultation context"
          message="Open this page from a consultation detail action so permissions can be validated."
          action={{
            label: 'Go to Dashboard',
            onClick: () => router.replace(ROLE_DASHBOARD[user.role] ?? ROUTES.login),
          }}
        />
      </main>
    );
  }

  // ── Guard: consultation not found ───────────────────────────────────────────
  if (consultationQuery.isError || !consultationQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState title="Consultation not found" message="Unable to load consultation details." />
      </main>
    );
  }

  const consultation = consultationQuery.data;

  // ── Guard: not a video consultation ─────────────────────────────────────────
  if (consultation.consultationType !== 'Video') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState
          title="Not a video consultation"
          message="This consultation does not support video calling."
        />
      </main>
    );
  }

  // ── Guard: consultation not in joinable state ────────────────────────────────
  if (consultation.status !== 'Confirmed' && consultation.status !== 'InProgress') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState
          title="Consultation not joinable"
          message="You can join only when consultation is Confirmed or InProgress."
          action={{
            label: 'Back to Consultation',
            onClick: () => router.replace(
              user.role === 'Doctor'
                ? ROUTES.doctor.consultationDetail(consultation.id)
                : ROUTES.patient.consultationDetail(consultation.id)
            ),
          }}
        />
      </main>
    );
  }

  // ── Loading token ────────────────────────────────────────────────────────────
  if (videoTokenQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-400">Connecting to consultation room…</p>
        </div>
      </div>
    );
  }

  // ── Token error ──────────────────────────────────────────────────────────────
  if (videoTokenQuery.isError || !videoTokenQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState
          title="Unable to join meeting"
          message="Token generation failed or your access is not permitted. Please try again."
          action={{
            label: 'Retry',
            onClick: () => { videoTokenQuery.refetch(); },
          }}
        />
      </main>
    );
  }

  const tokenData = videoTokenQuery.data;

  // ── Room URL mismatch — self-heal redirect ───────────────────────────────────
  if (routeRoomId !== tokenData.meetingRoomId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState
          title="Redirecting to your room…"
          message="Room URL was updated. Click below to join the correct room."
          action={{
            label: 'Join Correct Room',
            onClick: () => {
              router.replace(
                `${ROUTES.consultation.videoRoom(tokenData.meetingRoomId)}?consultationId=${consultation.id}`
              );
            },
          }}
        />
      </main>
    );
  }

  // LiveKit server URL: use backend-provided URL, fall back to env var
  const livekitServerUrl =
    (tokenData.liveKitUrl && tokenData.liveKitUrl.startsWith('wss://'))
      ? tokenData.liveKitUrl
      : env.liveKitServerUrl;

  // ── Render LiveKit room with premium UI ───────────────────────────────────────
  return (
    <main className="h-screen overflow-hidden bg-slate-950 text-white">
      <LiveKitRoom
        serverUrl={livekitServerUrl}
        token={tokenData.accessToken}
        connect
        video
        audio
        onDisconnected={handleLeave}
        className="h-full"
      >
        <ConsultationRoom
          consultation={consultation}
          participantIdentity={tokenData.participantIdentity}
          onLeave={handleLeave}
          onComplete={user.role === 'Doctor' ? handleComplete : undefined}
          isCompleting={isCompleting}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}

export default function VideoCallPage() {
  return <VideoCallContent />;
}
