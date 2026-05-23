import type { Metadata } from 'next';
import { AdminGuard } from '@/guards/admin.guard';

export const metadata: Metadata = { title: 'Manage Doctors' };

export default function AdminDoctorsPage() {
  return (
    <AdminGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Manage Doctors</h1>
      </main>
    </AdminGuard>
  );
}
