import { z } from 'zod';

export const doctorVerificationSchema = z.object({
  doctorId: z.string().uuid(),
  isApproved: z.boolean(),
  remarks: z.string().max(500).optional(),
});

export type DoctorVerificationSchema = z.infer<typeof doctorVerificationSchema>;
