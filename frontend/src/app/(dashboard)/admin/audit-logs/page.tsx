'use client';

import { AdminGuard } from '@/guards/admin.guard';
import { useAdminAuditLogs } from '@/modules/admin/hooks/useAdmin';
import { Spinner } from '@/components/shared/spinner';

function AuditLogsContent() {
  const { data, isLoading } = useAdminAuditLogs();

  if (isLoading) {
    return (
      <div className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8" style={{ background: '#E6E1DD', minHeight: '100%' }}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const logs = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10 space-y-5"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", letterSpacing: '-0.01em' }}
    >
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.03em' }}>Audit Logs</h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Full history of admin and system actions.</p>
      </div>

      {logs.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No audit logs available.</p>
      ) : (
        <div
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(18px) saturate(180%)',
            WebkitBackdropFilter: 'blur(18px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.45)',
            boxShadow: '0 8px 32px rgba(48,79,109,0.09)',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(48,79,109,0.08)', background: 'rgba(48,79,109,0.04)' }}>
                  {['Timestamp', 'Action', 'User', 'Details'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log: { id: string; createdAt: string; action: string; userName: string; details: string }, idx: number) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: idx < logs.length - 1 ? '1px solid rgba(48,79,109,0.07)' : undefined, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,225,160,0.15)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: '#6B7280' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: '#304F6D' }}>{log.action}</td>
                    <td className="px-5 py-3.5" style={{ color: '#1F2937' }}>{log.userName}</td>
                    <td className="px-5 py-3.5 max-w-xs truncate" style={{ color: '#6B7280' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
