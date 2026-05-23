import type { Metadata } from 'next';
import { AdminGuard } from '@/guards/admin.guard';

export const metadata: Metadata = { title: 'Admin Dashboard' };

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </main>
    </AdminGuard>
  );
}
