import type { Metadata } from 'next';
import { PatientGuard } from '@/guards/patient.guard';

export const metadata: Metadata = { title: 'Consultation History' };

export default function PatientConsultationHistoryPage() {
  return (
    <PatientGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Consultation History</h1>
      </main>
    </PatientGuard>
  );
}
