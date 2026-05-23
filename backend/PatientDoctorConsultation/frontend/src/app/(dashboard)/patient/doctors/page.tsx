import type { Metadata } from 'next';
import { PatientGuard } from '@/guards/patient.guard';

export const metadata: Metadata = { title: 'Find Doctors' };

export default function PatientDoctorsPage() {
  return (
    <PatientGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Find a Doctor</h1>
      </main>
    </PatientGuard>
  );
}
