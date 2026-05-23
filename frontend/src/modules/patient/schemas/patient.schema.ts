import { z } from 'zod';

export const updatePatientProfileSchema = z.object({
  fullName: z.string().min(1).max(100),
  phoneNumber: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  bloodGroup: z.string().max(5).optional(),
});

export type UpdatePatientProfileSchema = z.infer<typeof updatePatientProfileSchema>;
