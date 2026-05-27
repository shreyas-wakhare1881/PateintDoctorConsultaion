'use client';

import { AdminGuard } from '@/guards/admin.guard';
import { useAdminAuditLogs } from '@/modules/admin/hooks/useAdmin';
import { Spinner } from '@/components/shared/spinner';

function AuditLogsContent() {
  const { data, isLoading } = useAdminAuditLogs();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const logs = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      {logs.length === 0 ? (
        <p className="text-muted-foreground">No audit logs available.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log: { id: string; createdAt: string; action: string; userName: string; details: string }) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{log.action}</td>
                  <td className="px-4 py-3">{log.userName}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <AdminGuard>
      <AuditLogsContent />
    </AdminGuard>
  );
}
