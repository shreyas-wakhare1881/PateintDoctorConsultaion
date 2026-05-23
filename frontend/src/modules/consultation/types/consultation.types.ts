export type ConsultationDto = {
  id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  doctorSpecialization: string;
  scheduledAt: string;
  status: 'Pending' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow';
  roomId?: string;
  symptoms?: string;
  aiSummary?: string;
  createdAt: string;
};

export type ConsultationRoomDto = {
  roomId: string;
  livekitToken: string;
  livekitServerUrl: string;
};
