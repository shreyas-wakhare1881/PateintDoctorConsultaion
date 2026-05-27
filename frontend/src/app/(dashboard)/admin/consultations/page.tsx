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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Consultation Monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide consultation visibility for compliance and operations.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm">
          <option value="">All status</option>
          {['Pending', 'Confirmed', 'Rejected', 'Cancelled', 'InProgress', 'Completed', 'NoShow'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={consultationType} onChange={(e) => setConsultationType(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm">
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
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Number</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Patient</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Doctor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Specialization</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c: (typeof items)[number]) => (
                <tr key={c.consultationId} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{c.consultationNumber}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.patientName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.doctorName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.specialization ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.status}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.scheduledDate}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={ROUTES.admin.consultationDetail(c.consultationId)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      View
                    </Link>
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

export default function AdminConsultationsPage() {
  return (
    <AdminGuard>
      <AdminConsultationsContent />
    </AdminGuard>
  );
}

