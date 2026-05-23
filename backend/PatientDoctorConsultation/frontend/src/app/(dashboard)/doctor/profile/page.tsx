import type { Metadata } from 'next';
import { DoctorGuard } from '@/guards/doctor.guard';

export const metadata: Metadata = { title: 'Doctor Profile' };

export default function DoctorProfilePage() {
  return (
    <DoctorGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
      </main>
    </DoctorGuard>
  );
}
