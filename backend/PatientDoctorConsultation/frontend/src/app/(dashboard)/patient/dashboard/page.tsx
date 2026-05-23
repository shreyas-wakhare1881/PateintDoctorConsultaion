import type { Metadata } from 'next';
import { PatientGuard } from '@/guards/patient.guard';

export const metadata: Metadata = { title: 'Patient Dashboard' };

export default function PatientDashboardPage() {
  return (
    <PatientGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Patient Dashboard</h1>
      </main>
    </PatientGuard>
  );
}
