'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { DoctorGuard } from '@/guards/doctor.guard';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ROUTES } from '@/config/routes';
import {
  useCompleteConsultation,
  useConsultationById,
  useConsultationHistory,
  useStartConsultation,
} from '@/modules/consultation/hooks/useConsultation';
import { useDoctorStatusGate } from '@/modules/doctor/hooks/useDoctor';
import { parseApiError } from '@/utils/errors';

function DoctorConsultationDetailContent() {
  const params = useParams<{ id: string }>();
  const consultationId = params?.id ?? '';

  const { isLoading: gateLoading, isApproved } = useDoctorStatusGate();
  const detailsQuery = useConsultationById(consultationId);
  const historyQuery = useConsultationHistory(consultationId);
  const startMutation = useStartConsultation();
  const completeMutation = useCompleteConsultation();

  if (gateLoading || !isApproved || detailsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return <EmptyState title="Consultation not found" message="Unable to load consultation details." />;
  }

  const c = detailsQuery.data;
  const canStart = c.status === 'Confirmed';
  const canComplete = c.status === 'InProgress';
  const canJoin = c.consultationType === 'Video' && (c.status === 'Confirmed' || c.status === 'InProgress') && !!c.meetingRoomId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultation Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">{c.consultationNumber}</p>
        </div>
        <Link href={ROUTES.doctor.consultations} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
          Back to Consultations
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Patient" value={c.patientName} />
        <Card label="Status" value={c.status} />
        <Card label="Date" value={c.scheduledDate} />
        <Card label="Time" value={`${c.startTime} - ${c.endTime}`} />
        <Card label="Type" value={c.consultationType} />
        <Card label="Fee Snapshot" value={`INR ${c.consultationFeeSnapshot}`} />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Symptoms</h2>
        <p className="mt-2 text-sm text-foreground/90">{c.symptoms}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {canJoin && (
          <Link
            href={`${ROUTES.consultation.videoRoom(c.meetingRoomId!)}?consultationId=${c.id}`}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Join Call
          </Link>
        )}
        {canStart && (
          <button
            type="button"
            onClick={async () => {
              try {
                await startMutation.mutateAsync(c.id);
                toast.success('Consultation started.');
              } catch (err) {
                toast.error(parseApiError(err).message ?? 'Failed to start consultation.');
              }
            }}
            disabled={startMutation.isPending}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Start Consultation
          </button>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={async () => {
              const notes = window.prompt('Add optional completion notes') ?? undefined;
              try {
                await completeMutation.mutateAsync({ id: c.id, notes: notes?.trim() || undefined });
                toast.success('Consultation completed.');
              } catch (err) {
                toast.error(parseApiError(err).message ?? 'Failed to complete consultation.');
              }
            }}
            disabled={completeMutation.isPending}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Complete Consultation
          </button>
        )}
      </div>

      {c.notes && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Clinical Notes</h2>
          <p className="mt-2 text-sm text-foreground/90">{c.notes}</p>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status Timeline</h2>
        {historyQuery.isLoading ? (
          <div className="mt-4"><Spinner /></div>
        ) : historyQuery.data && historyQuery.data.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {historyQuery.data.map((h) => (
              <li key={h.id} className="rounded-lg border bg-background px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{h.oldStatus ?? 'Created'} → {h.newStatus}</p>
                <p className="text-xs text-muted-foreground">By {h.changedByName} at {new Date(h.createdAt).toLocaleString()}</p>
                {h.reason && <p className="mt-1 text-xs text-muted-foreground">Reason: {h.reason}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No status events found.</p>
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

export default function DoctorConsultationDetailPage() {
  return (
    <DoctorGuard>
      <DoctorConsultationDetailContent />
    </DoctorGuard>
  );
}
