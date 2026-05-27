'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import { useAuthStore } from '@/store/auth.store';
import { ROLE_DASHBOARD, ROLE_LOGIN, ROUTES } from '@/config/routes';
import { EmptyState } from '@/components/shared/empty-state';
import { Spinner } from '@/components/shared/spinner';
import {
  useConsultationById,
  useConsultationVideoToken,
} from '@/modules/consultation/hooks/useConsultation';

function VideoCallContent() {
  const router = useRouter();
  const params = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();

  const consultationId = searchParams.get('consultationId') ?? '';
  const routeRoomId = params?.roomId ?? '';

  const { isAuthenticated, isSessionLoading, user } = useAuthStore();

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

  const consultationQuery = useConsultationById(consultationId);
  const videoTokenQuery = useConsultationVideoToken(
    consultationId,
    !!consultationId && consultationQuery.data?.consultationType === 'Video'
  );

  if (isSessionLoading || consultationQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

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

  if (consultationQuery.isError || !consultationQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState title="Consultation not found" message="Unable to load consultation details." />
      </main>
    );
  }

  const consultation = consultationQuery.data;

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

  if (consultation.status !== 'Confirmed' && consultation.status !== 'InProgress') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState
          title="Consultation not joinable"
          message="You can join only when consultation is Confirmed or InProgress."
        />
      </main>
    );
  }

  if (videoTokenQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (videoTokenQuery.isError || !videoTokenQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState
          title="Unable to join meeting"
          message="Token generation failed or your access is not permitted."
        />
      </main>
    );
  }

  const tokenData = videoTokenQuery.data;

  if (routeRoomId !== tokenData.meetingRoomId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <EmptyState
          title="Invalid room URL"
          message="Please re-open the room from consultation details."
          action={{
            label: 'Open Correct Room',
            onClick: () => {
              router.replace(`${ROUTES.consultation.videoRoom(tokenData.meetingRoomId)}?consultationId=${consultation.id}`);
            },
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{consultation.consultationNumber}</p>
          <p className="text-xs text-slate-400">Room: {tokenData.meetingRoomId}</p>
        </div>
        <Link
          href={user.role === 'Doctor' ? ROUTES.doctor.consultationDetail(consultation.id) : ROUTES.patient.consultationDetail(consultation.id)}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
        >
          Back to Consultation
        </Link>
      </div>

      <div className="h-[calc(100vh-56px)] p-3">
        <LiveKitRoom
          serverUrl={tokenData.liveKitUrl}
          token={tokenData.accessToken}
          connect
          video
          audio
          className="flex h-full flex-col gap-3"
        >
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 p-2">
            <VideoConference />
          </div>
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </main>
  );
}

export default function VideoCallPage() {
  return <VideoCallContent />;
}

