'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/guards/admin.guard';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { useAdminConsultations } from '@/modules/admin/hooks/useAdmin';
import { ROUTES } from '@/config/routes';

function AdminConsultationsContent() {
  const [status, setStatus] = useState('');
  const [consultationType, setConsultationType] = useState('');

  const params: Record<string, unknown> = { page: 1, pageSize: 30 };
  if (status) params.status = status;
  if (consultationType) params.consultationType = consultationType;

  const { data, isLoading, isError } = useAdminConsultations(params);
  const items = data?.items ?? [];

  const GLASS_TABLE: React.CSSProperties = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(18px) saturate(180%)',
    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.45)',
    boxShadow: '0 8px 32px rgba(48,79,109,0.09)',
    borderRadius: 20,
    overflow: 'hidden',
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    Pending:    { bg: 'rgba(255,225,160,0.35)', color: '#8a6a00' },
    Confirmed:  { bg: 'rgba(48,79,109,0.12)',   color: '#304F6D' },
    InProgress: { bg: 'rgba(224,125,84,0.15)',  color: '#b85c30' },
    Completed:  { bg: 'rgba(137,148,129,0.15)', color: '#596550' },
    Rejected:   { bg: 'rgba(239,68,68,0.10)',   color: '#991B1B' },
    Cancelled:  { bg: 'rgba(107,114,128,0.10)', color: '#4B5563' },
    NoShow:     { bg: 'rgba(239,68,68,0.07)',   color: '#991B1B' },
  };

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10 space-y-5"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", letterSpacing: '-0.01em' }}
    >
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.03em' }}>Consultation Monitoring</h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Platform-wide consultation visibility for compliance and operations.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-xl border px-3 text-sm outline-none transition-all focus:ring-2"
          style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', borderColor: 'rgba(48,79,109,0.12)', color: '#1F2937' }}
        >
          <option value="">All status</option>
          {['Pending', 'Confirmed', 'Rejected', 'Cancelled', 'InProgress', 'Completed', 'NoShow'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={consultationType}
          onChange={(e) => setConsultationType(e.target.value)}
          className="h-10 rounded-xl border px-3 text-sm outline-none transition-all focus:ring-2"
          style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(12px)', borderColor: 'rgba(48,79,109,0.12)', color: '#1F2937' }}
        >
          <option value="">All types</option>
          <option value="Video">Video</option>
          <option value="InPerson">InPerson</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" /></div>
      ) : isError ? (
        <EmptyState title="Failed to load consultations" message="Please retry." />
      ) : items.length === 0 ? (
        <EmptyState title="No consultations found" message="Try broadening your filters." />
      ) : (
        <div style={GLASS_TABLE}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(48,79,109,0.08)', background: 'rgba(48,79,109,0.04)' }}>
                  {['Number', 'Patient', 'Doctor', 'Specialization', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((c: (typeof items)[number], idx: number) => {
                  const sc = statusColors[c.status] ?? { bg: 'rgba(107,114,128,0.10)', color: '#4B5563' };
                  return (
                    <tr
                      key={c.consultationId}
                      style={{ borderBottom: idx < items.length - 1 ? '1px solid rgba(48,79,109,0.07)' : undefined, transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,225,160,0.15)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <td className="px-5 py-3.5 text-sm font-mono font-semibold" style={{ color: '#304F6D' }}>{c.consultationNumber}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#1F2937' }}>{c.patientName}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: '#6B7280' }}>{c.doctorName}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: '#6B7280' }}>{c.specialization ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: '#6B7280' }}>{c.scheduledDate}</td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={ROUTES.admin.consultationDetail(c.consultationId)}
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: 'rgba(48,79,109,0.07)', color: '#304F6D', border: '1px solid rgba(48,79,109,0.12)' }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminConsultationsPage() {
  return (
    <AdminGuard>
      <AdminConsultationsContent />
    </AdminGuard>
  );
}

