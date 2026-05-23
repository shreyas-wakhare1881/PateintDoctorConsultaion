export default function VideoCallPage({ params }: { params: { roomId: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <p className="text-white text-lg">Connecting to room: {params.roomId}</p>
    </main>
  );
}

