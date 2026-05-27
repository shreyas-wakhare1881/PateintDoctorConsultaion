export type ConsultationStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Rejected'
  | 'Cancelled'
  | 'InProgress'
  | 'Completed'
  | 'NoShow';

export type ConsultationType = 'Video' | 'InPerson';

export type ConsultationSummaryDto = {
  id: string;
  consultationNumber: string;
  status: ConsultationStatus;
  consultationType: ConsultationType;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string | null;
  doctorProfileImageUrl: string | null;
  patientId: string;
  patientName: string;
  consultationFeeSnapshot: number;
  isFollowUp: boolean;
  createdAt: string;
};

export type ConsultationDetailsDto = {
  id: string;
  consultationNumber: string;
  status: ConsultationStatus;
  consultationType: ConsultationType;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string | null;
  doctorProfileImageUrl: string | null;
  patientId: string;
  patientName: string;
  symptoms: string;
  notes: string | null;
  cancellationReason: string | null;
  cancelledBy: 'Patient' | 'Doctor' | 'Admin' | null;
  meetingRoomId: string | null;
  meetingLink: string | null;
  meetingStartedAt: string | null;
  meetingEndedAt: string | null;
  consultationFeeSnapshot: number;
  isFollowUp: boolean;
  parentConsultationId: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ConsultationStatusHistoryDto = {
  id: string;
  consultationId: string;
  oldStatus: ConsultationStatus | null;
  newStatus: ConsultationStatus;
  changedByUserId: string;
  changedByName: string;
  reason: string | null;
  createdAt: string;
};

export type ConsultationVideoTokenDto = {
  consultationId: string;
  meetingRoomId: string;
  accessToken: string;
  liveKitUrl: string;
  participantIdentity: string;
  expiresAt: string;
};

export type ConsultationListQuery = {
  status?: ConsultationStatus;
  page?: number;
  pageSize?: number;
};

export type BookConsultationRequest = {
  doctorId: string;
  availabilityId?: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  consultationType: ConsultationType;
  symptoms: string;
  isFollowUp?: boolean;
  parentConsultationId?: string | null;
};
