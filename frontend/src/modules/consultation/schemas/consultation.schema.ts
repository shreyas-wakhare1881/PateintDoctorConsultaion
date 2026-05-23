import { z } from 'zod';

export const bookConsultationSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor ID'),
  scheduledAt: z.string().refine((v) => new Date(v) > new Date(), {
    message: 'Scheduled time must be in the future',
  }),
  symptoms: z.string().max(1000).optional(),
});

export type BookConsultationSchema = z.infer<typeof bookConsultationSchema>;
