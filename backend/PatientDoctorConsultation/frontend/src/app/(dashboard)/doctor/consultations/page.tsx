import type { Metadata } from 'next';
import { DoctorGuard } from '@/guards/doctor.guard';

export const metadata: Metadata = { title: 'My Consultations' };

export default function DoctorConsultationsPage() {
  return (
    <DoctorGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">My Consultations</h1>
      </main>
    </DoctorGuard>
  );
}
