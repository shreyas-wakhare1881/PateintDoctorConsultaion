import { z } from 'zod';

export const updateDoctorProfileSchema = z.object({
  fullName: z.string().min(1).max(100),
  specialization: z.string().min(1).max(100),
  phoneNumber: z.string().max(20).optional(),
  bio: z.string().max(1000).optional(),
  consultationFee: z.number().min(0),
});

export type UpdateDoctorProfileSchema = z.infer<typeof updateDoctorProfileSchema>;
