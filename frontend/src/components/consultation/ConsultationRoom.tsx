'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useConnectionState,
  useTracks,
  VideoTrack,
  useConnectionQualityIndicator,
} from '@livekit/components-react';
import {
  ConnectionState,
  RoomEvent,
  Track,
  Participant,
  ConnectionQuality,
} from 'livekit-client';
import type { TrackReference } from '@livekit/components-react';
import type { ConsultationDetailsDto } from '@/modules/consultation/types/consultation.types';
import { useAuthStore } from '@/store/auth.store';
import { useConsultationStore } from '@/store/consultation.store';
import { cn } from '@/utils/cn';

const MicOnIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a7 7 0 01-7-7H3a9 9 0 0018 0h-2a7 7 0 01-7 7z" />
  </svg>
);
const MicOffIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3.27 3L2 4.27l6.01 6.01V11a4 4 0 006.9 2.76l1.42 1.42A6 6 0 017 11H5a7 7 0 0011.95 4.95l1.42 1.42L20 15.73l-2.27-2.27A9 9 0 0019 11h-2a7 7 0 01-.14 1.4L15 10.54V5a3 3 0 00-3-3 3.003 3.003 0 00-2.56 1.44L3.27 3zM9 11V5a3 3 0 013-3v3.73L9 3z" />
  </svg>
);
const CamOnIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);
const CamOffIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 6.5l-4-4-15 15 1.41 1.41L7 15.37V17c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4V6.5zM17 16H9.63l-2-2H17v2zm-9.48-4.9L3.27 6.26A1 1 0 003 6C2.45 6 2 6.45 2 7v10c0 .55.45 1 1 1h1.73l3-3H7.52z" />
  </svg>
);
const PhoneOffIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
  </svg>
);
const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const FullscreenIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

function QualityDot({ participant }: { participant: Participant }) {
  const { quality } = useConnectionQualityIndicator({ participant });
  const color =
    quality === ConnectionQuality.Excellent ? 'bg-emerald-400' :
    quality === ConnectionQuality.Good ? 'bg-lime-400' :
    quality === ConnectionQuality.Poor ? 'bg-amber-400' :
    'bg-slate-600';
  return <span className={cn('inline-block h-2 w-2 rounded-full', color)} title={`Connection: ${quality}`} />;
}

function ConsultationTimer({ startedAt }: { startedAt: Date | null }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    setElapsed(Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000)));
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
      <span className="font-mono text-sm font-semibold tabular-nums text-white/80">
        {h > 0
          ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
          : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}
      </span>
    </div>
  );
}

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-4xl font-bold text-white ring-2 ring-white/10">
      {initials}
    </div>
  );
}

interface VideoTileProps {
  trackRef: TrackReference | null;
  participant: Participant | null;
  label: 'Doctor' | 'Patient';
  isWaiting: boolean;
  isMicMuted: boolean;
  className?: string;
}

function VideoTile({ trackRef, participant, label, isWaiting, isMicMuted, className }: VideoTileProps) {
  const displayName = participant?.name || participant?.identity || label;
  return (
    <div className={cn(
      'relative flex flex-col overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10 shadow-2xl transition-all duration-200',
      participant?.isSpeaking && 'ring-2 ring-emerald-400',
      className,
    )}>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950 min-h-0">
        {trackRef ? (
          <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-4 p-8">
            <AvatarPlaceholder name={displayName} />
            <div className="flex items-center gap-2">
              {isWaiting && <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
              <p className="text-sm text-slate-400">{isWaiting ? 'Waiting to join...' : 'Camera off'}</p>
            </div>
          </div>
        )}
        {participant?.isSpeaking && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-emerald-400/60" />
        )}
        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/90">{label}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between bg-slate-900/95 px-3 py-2 backdrop-blur-sm">
        <span className="min-w-0 truncate text-sm font-medium text-white">{displayName}</span>
        <div className="flex shrink-0 items-center gap-2">
          {participant && <QualityDot participant={participant} />}
          <div className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full',
            isMicMuted ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400',
          )}>
            {isMicMuted ? <MicOffIcon /> : <MicOnIcon />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlsBar({
  isMicEnabled, isCamEnabled, onToggleMic, onToggleCam, onLeave, onComplete,
  isDoctor, isCompleting, canComplete,
}: {
  isMicEnabled: boolean; isCamEnabled: boolean;
  onToggleMic: () => void; onToggleCam: () => void;
  onLeave: () => void; onComplete?: () => void;
  isDoctor: boolean; isCompleting?: boolean; canComplete: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button type="button" onClick={onToggleMic} title={isMicEnabled ? 'Mute' : 'Unmute'}
        className={cn('flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-95',
          !isMicEnabled ? 'bg-red-600 text-white ring-2 ring-red-400/40 hover:bg-red-700' : 'bg-slate-700 text-white hover:bg-slate-600')}>
        {isMicEnabled ? <MicOnIcon /> : <MicOffIcon />}
      </button>
      <button type="button" onClick={onToggleCam} title={isCamEnabled ? 'Camera off' : 'Camera on'}
        className={cn('flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-95',
          !isCamEnabled ? 'bg-red-600 text-white ring-2 ring-red-400/40 hover:bg-red-700' : 'bg-slate-700 text-white hover:bg-slate-600')}>
        {isCamEnabled ? <CamOnIcon /> : <CamOffIcon />}
      </button>
      <button type="button" onClick={onLeave} title="Leave"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all hover:bg-red-700 active:scale-95">
        <PhoneOffIcon />
      </button>
      {isDoctor && canComplete && (
        <button type="button" onClick={onComplete} disabled={isCompleting}
          className="flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 disabled:opacity-60 active:scale-95">
          <CheckIcon />
          <span className="hidden sm:inline">{isCompleting ? 'Completing...' : 'Complete'}</span>
        </button>
      )}
    </div>
  );
}

function ConnectionBanner({ state }: { state: ConnectionState }) {
  if (state === ConnectionState.Connected) return null;
  const label = state === ConnectionState.Reconnecting ? 'Reconnecting - please wait...'
    : state === ConnectionState.Disconnected ? 'Disconnected from room.'
    : 'Connecting to room...';
  const bg = state === ConnectionState.Reconnecting ? 'bg-amber-500/90'
    : state === ConnectionState.Disconnected ? 'bg-red-600/90' : 'bg-sky-600/90';
  return (
    <div className={cn('absolute inset-x-0 top-0 z-50 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white', bg)}>
      {state === ConnectionState.Reconnecting && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {label}
    </div>
  );
}

export interface ConsultationRoomProps {
  consultation: ConsultationDetailsDto;
  participantIdentity: string;
  onLeave: () => void;
  onComplete?: (notes?: string) => Promise<void>;
  isCompleting?: boolean;
}

export function ConsultationRoom({
  consultation,
  participantIdentity,
  onLeave,
  onComplete,
  isCompleting = false,
}: ConsultationRoomProps) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const allParticipants = useParticipants();
  const { setCallActive, setActiveConsultation } = useConsultationStore();
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [callStartedAt, setCallStartedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!room) return;
    const onConnected = () => {
      setCallStartedAt(new Date());
      setCallActive(true);
      setActiveConsultation({ id: consultation.id, roomId: room.name });
    };
    room.on(RoomEvent.Connected, onConnected);
    return () => { room.off(RoomEvent.Connected, onConnected); };
  }, [room, consultation.id, setCallActive, setActiveConsultation]);

  const allCameraTracks = useTracks(
    [Track.Source.Camera],
    { onlySubscribed: false }
  ) as TrackReference[];

  const doctorParticipant = allParticipants.find((p) => p.identity.startsWith('doctor-')) ?? null;
  const patientParticipant = allParticipants.find((p) => p.identity.startsWith('patient-')) ?? null;

  const doctorTrackRef = allCameraTracks.find((t) => t.participant.identity.startsWith('doctor-')) ?? null;
  const patientTrackRef = allCameraTracks.find((t) => t.participant.identity.startsWith('patient-')) ?? null;

  const isMicMuted = (p: Participant | null) =>
    p ? [...p.audioTrackPublications.values()].every((pub) => pub.isMuted) : true;

  const handleToggleMic = useCallback(async () => {
    try { await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled); } catch { /* ignore */ }
  }, [localParticipant, isMicrophoneEnabled]);

  const handleToggleCam = useCallback(async () => {
    try { await localParticipant.setCameraEnabled(!isCameraEnabled); } catch { /* ignore */ }
  }, [localParticipant, isCameraEnabled]);

  const handleComplete = useCallback(async () => {
    if (!onComplete) return;
    const notes = window.prompt('Optional clinical notes (or Cancel to skip)') ?? undefined;
    await onComplete(notes?.trim() || undefined);
  }, [onComplete]);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div ref={containerRef} className="relative flex h-full flex-col overflow-hidden bg-slate-950 text-white">
      <ConnectionBanner state={connectionState} />
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-red-400">
              {connectionState === ConnectionState.Connected ? 'Live' : 'Connecting'}
            </span>
          </div>
          <div className="h-4 w-px shrink-0 bg-slate-700" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{consultation.consultationNumber}</p>
            <p className="truncate text-[11px] text-slate-400">
              {consultation.doctorName} &amp; {consultation.patientName}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {callStartedAt && <ConsultationTimer startedAt={callStartedAt} />}
          <button type="button" onClick={handleFullscreen} title="Fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition">
            <FullscreenIcon />
          </button>
          <button type="button" onClick={onLeave}
            className="flex items-center gap-1.5 rounded-md bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-400 ring-1 ring-red-500/30 transition hover:bg-red-600/30 active:scale-95">
            <PhoneOffIcon /><span>Leave</span>
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3 sm:flex-row min-h-0">
        <VideoTile
          trackRef={doctorTrackRef}
          participant={doctorParticipant}
          label="Doctor"
          isWaiting={!doctorParticipant}
          isMicMuted={isMicMuted(doctorParticipant)}
          className="flex-1 min-h-0"
        />
        <div className="hidden w-px shrink-0 bg-slate-800 sm:block" />
        <div className="h-px w-full shrink-0 bg-slate-800 sm:hidden" />
        <VideoTile
          trackRef={patientTrackRef}
          participant={patientParticipant}
          label="Patient"
          isWaiting={!patientParticipant}
          isMicMuted={isMicMuted(patientParticipant)}
          className="flex-1 min-h-0"
        />
      </div>
      <footer className="shrink-0 border-t border-slate-800 bg-slate-950/95 px-4 backdrop-blur-sm">
        <ControlsBar
          isMicEnabled={isMicrophoneEnabled}
          isCamEnabled={isCameraEnabled}
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCam}
          onLeave={onLeave}
          onComplete={handleComplete}
          isDoctor={user?.role === 'Doctor'}
          isCompleting={isCompleting}
          canComplete={consultation.status === 'InProgress'}
        />
      </footer>
    </div>
  );
}
