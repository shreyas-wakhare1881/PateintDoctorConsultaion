import type { Metadata } from 'next';
import { PatientGuard } from '@/guards/patient.guard';

export const metadata: Metadata = { title: 'Patient Profile' };

export default function PatientProfilePage() {
  return (
    <PatientGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
      </main>
    </PatientGuard>
  );
}
