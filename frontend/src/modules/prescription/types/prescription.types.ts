export type PrescriptionItemDto = {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
};

export type PrescriptionDto = {
  id: string;
  consultationId: string;
  doctorId: string;
  patientId: string;
  diagnosis: string | null;
  generalInstructions: string | null;
  issuedAt: string;
  items: PrescriptionItemDto[];
  createdAt: string;
};

export type CreatePrescriptionItemRequest = {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

export type CreatePrescriptionRequest = {
  diagnosis?: string;
  generalInstructions?: string;
  items: CreatePrescriptionItemRequest[];
};
