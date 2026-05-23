export const generateRoomDisplayName = (consultationId: string): string =>
  `room-${consultationId.slice(0, 8)}`;

export const formatDuration = (startedAt: string, endedAt: string): string => {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
};
