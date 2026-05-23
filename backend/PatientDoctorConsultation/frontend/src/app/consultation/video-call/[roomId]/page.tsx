import type { Metadata } from 'next';
import { AuthGuard } from '@/guards/auth.guard';

export const metadata: Metadata = { title: 'Video Consultation' };

interface Props {
  params: { roomId: string };
}

export default function VideoCallPage({ params }: Props) {
  return (
    <AuthGuard>
      <main className="flex h-screen flex-col items-center justify-center bg-gray-950">
        <p className="text-white text-lg">Room: {params.roomId}</p>
        {/* LiveKit video components will be rendered here */}
      </main>
    </AuthGuard>
  );
}
