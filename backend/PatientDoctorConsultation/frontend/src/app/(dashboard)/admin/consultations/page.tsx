import type { Metadata } from 'next';
import { AdminGuard } from '@/guards/admin.guard';

export const metadata: Metadata = { title: 'All Consultations' };

export default function AdminConsultationsPage() {
  return (
    <AdminGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">All Consultations</h1>
      </main>
    </AdminGuard>
  );
}
