import type { Metadata } from 'next';
import { DoctorGuard } from '@/guards/doctor.guard';

export const metadata: Metadata = { title: 'Doctor Dashboard' };

export default function DoctorDashboardPage() {
  return (
    <DoctorGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Doctor Dashboard</h1>
      </main>
    </DoctorGuard>
  );
}
