import type { Metadata } from 'next';
import { DoctorGuard } from '@/guards/doctor.guard';

export const metadata: Metadata = { title: 'Manage Availability' };

export default function DoctorAvailabilityPage() {
  return (
    <DoctorGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Manage Availability</h1>
      </main>
    </DoctorGuard>
  );
}
