'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminGuard } from '@/guards/admin.guard';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { useAdminConsultationById } from '@/modules/admin/hooks/useAdmin';
import { ROUTES } from '@/config/routes';

function AdminConsultationDetailContent() {
  const params = useParams<{ id: string }>();
  const consultationId = params?.id ?? '';
  const { data, isLoading, isError } = useAdminConsultationById(consultationId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState title="Consultation not found" message="Unable to fetch consultation detail." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultation Detail</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.consultationNumber}</p>
        </div>
        <Link href={ROUTES.admin.consultations} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
          Back to Monitoring
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Status" value={data.status} />
        <Card label="Patient" value={data.patientName} />
        <Card label="Doctor" value={data.doctorName} />
        <Card label="Specialization" value={data.specialization ?? '—'} />
        <Card label="Date" value={data.scheduledDate} />
        <Card label="Time" value={`${data.startTime} - ${data.endTime}`} />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Patient Phone</h2>
        <p className="mt-2 text-sm text-foreground/90">{data.patientPhone}</p>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Symptoms</h2>
        <p className="mt-2 text-sm text-foreground/90">{data.symptoms ?? '—'}</p>
      </div>

      {data.cancellationReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">Cancellation Reason</h2>
          <p className="mt-2 text-sm text-red-800">{data.cancellationReason}</p>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status Timeline</h2>
        {data.statusHistory.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No status changes recorded.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.statusHistory.map((h: (typeof data.statusHistory)[number], idx: number) => (
              <li key={`${h.changedAt}-${idx}`} className="rounded-lg border bg-background px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{h.oldStatus ?? 'Created'} → {h.newStatus}</p>
                <p className="text-xs text-muted-foreground">{new Date(h.changedAt).toLocaleString()}</p>
                {h.reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {h.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function AdminConsultationDetailPage() {
  return (
    <AdminGuard>
      <AdminConsultationDetailContent />
    </AdminGuard>
  );
}
