'use client';

import { AdminGuard } from '@/guards/admin.guard';
import { useAdminPatients, useBlockPatient, useUnblockPatient } from '@/modules/admin/hooks/useAdmin';
import { Spinner } from '@/components/shared/spinner';

function AdminPatientsContent() {
  const { data, isLoading } = useAdminPatients();
  const blockMutation = useBlockPatient();
  const unblockMutation = useUnblockPatient();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const patients = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Patients</h1>

      {patients.length === 0 ? (
        <p className="text-muted-foreground">No patients found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {patients.map((p: { userId: string; fullName: string; phoneNumber: string; isActive: boolean; createdAt: string }) => (
                <tr key={p.userId}>
                  <td className="px-4 py-3 font-medium">{p.fullName}</td>
                  <td className="px-4 py-3">{p.phoneNumber}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {p.isActive ? (
                      <button
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        disabled={blockMutation.isPending}
                        onClick={() => blockMutation.mutate({ userId: p.userId, reason: 'Admin action' })}
                      >
                        Block
                      </button>
                    ) : (
                      <button
                        className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50"
                        disabled={unblockMutation.isPending}
                        onClick={() => unblockMutation.mutate(p.userId)}
                      >
                        Unblock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPatientsPage() {
  return (
    <AdminGuard>
      <AdminPatientsContent />
    </AdminGuard>
  );
}
