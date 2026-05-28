'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PatientGuard } from '@/guards/patient.guard';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ROUTES } from '@/config/routes';
import { useConsultationById, useConsultationHistory } from '@/modules/consultation/hooks/useConsultation';
import { usePrescriptionByConsultation } from '@/modules/prescription/hooks/usePrescription';
import { PrescriptionViewer } from '@/components/consultation/PrescriptionViewer';

function PatientConsultationDetailContent() {
  const params = useParams<{ id: string }>();
  const consultationId = params?.id ?? '';

  const detailsQuery = useConsultationById(consultationId);
  const historyQuery = useConsultationHistory(consultationId);

  const canViewPrescription =
    detailsQuery.data?.status === 'Completed' || detailsQuery.data?.status === 'InProgress';
  const prescriptionQuery = usePrescriptionByConsultation(consultationId, !!canViewPrescription);

  if (detailsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return <EmptyState title="Consultation not found" message="This consultation is unavailable." />;
  }

  const c = detailsQuery.data;
  const canJoin = c.consultationType === 'Video' && (c.status === 'Confirmed' || c.status === 'InProgress') && !!c.meetingRoomId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultation Details</h1>
          <p className="mt-1 text-sm text-muted-foreground">{c.consultationNumber}</p>
        </div>
        <Link href={ROUTES.patient.consultations} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
          Back to List
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Doctor" value={c.doctorName} />
        <Card label="Specialization" value={c.doctorSpecialization ?? '—'} />
        <Card label="Status" value={c.status} />
        <Card label="Date" value={c.scheduledDate} />
        <Card label="Time" value={`${c.startTime} - ${c.endTime}`} />
        <Card label="Consultation Type" value={c.consultationType} />
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Symptoms</h2>
        <p className="mt-2 text-sm text-foreground/90">{c.symptoms}</p>
      </div>

      {c.notes && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Doctor Notes</h2>
          <p className="mt-2 text-sm text-foreground/90">{c.notes}</p>
        </div>
      )}

      {c.cancellationReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">Cancellation</h2>
          <p className="mt-2 text-sm text-red-800">{c.cancellationReason}</p>
          <p className="mt-1 text-xs text-red-600">Cancelled By: {c.cancelledBy ?? '—'}</p>
        </div>
      )}

      {canJoin && (
        <div className="flex justify-end">
          <Link
            href={`${ROUTES.consultation.videoRoom(c.meetingRoomId!)}?consultationId=${c.id}`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Join Video Consultation
          </Link>
        </div>
      )}

      {/* ── Prescription ──────────────────────────────────────────────────── */}
      {canViewPrescription && prescriptionQuery.data && (
        <PrescriptionViewer prescription={prescriptionQuery.data} />
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

export default function PatientConsultationDetailPage() {
  return (
    <PatientGuard>
      <PatientConsultationDetailContent />
    </PatientGuard>
  );
}
