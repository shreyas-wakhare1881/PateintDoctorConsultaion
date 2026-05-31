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
      <div className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8" style={{ background: '#E6E1DD', minHeight: '100%' }}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const patients = Array.isArray(data) ? data : data?.items ?? [];

  const statusStyle = (active: boolean): React.CSSProperties =>
    active
      ? { background: 'rgba(137,148,129,0.15)', color: '#596550' }
      : { background: 'rgba(239,68,68,0.09)',   color: '#991B1B' };

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10 space-y-5"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", letterSpacing: '-0.01em' }}
    >
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.03em' }}>Patients</h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>{patients.length} registered patient{patients.length !== 1 ? 's' : ''}</p>
      </div>

      {patients.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No patients found.</p>
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
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Phone</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Joined</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p: { userId: string; fullName: string; phoneNumber: string; isActive: boolean; createdAt: string }, idx: number) => (
                  <tr
                    key={p.userId}
                    style={{ borderBottom: idx < patients.length - 1 ? '1px solid rgba(48,79,109,0.07)' : undefined, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,225,160,0.15)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <td className="px-5 py-3.5 font-semibold" style={{ color: '#1F2937' }}>{p.fullName}</td>
                    <td className="px-5 py-3.5" style={{ color: '#6B7280' }}>{p.phoneNumber}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" style={statusStyle(p.isActive)}>
                        {p.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#6B7280' }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.isActive ? (
                        <button
                          className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ background: 'rgba(239,68,68,0.09)', color: '#991B1B', border: '1px solid rgba(239,68,68,0.20)' }}
                          disabled={blockMutation.isPending}
                          onClick={() => blockMutation.mutate({ userId: p.userId, reason: 'Admin action' })}
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
                          style={{ background: 'rgba(137,148,129,0.15)', color: '#596550', border: '1px solid rgba(137,148,129,0.25)' }}
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
