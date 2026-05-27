'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PatientGuard } from '@/guards/patient.guard';
import { EmptyState } from '@/components/shared/empty-state';
import { Spinner } from '@/components/shared/spinner';
import { ROUTES } from '@/config/routes';
import {
  useCancelConsultation,
  useMyConsultations,
} from '@/modules/consultation/hooks/useConsultation';
import type { ConsultationStatus } from '@/modules/consultation/types/consultation.types';
import { parseApiError } from '@/utils/errors';

const STATUS_FILTERS: Array<{ label: string; value: '' | ConsultationStatus }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'In Progress', value: 'InProgress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Rejected', value: 'Rejected' },
  { label: 'No Show', value: 'NoShow' },
];

function PatientConsultationHistoryContent() {
  const [status, setStatus] = useState<'' | ConsultationStatus>('');
  const { data, isLoading, isError } = useMyConsultations(
    status ? { status, page: 1, pageSize: 20 } : { page: 1, pageSize: 20 }
  );
  const cancelMutation = useCancelConsultation();

  const consultations = data?.items ?? [];

  const handleCancel = async (id: string) => {
    const reason = window.prompt('Enter cancellation reason (minimum 10 characters)');
    if (!reason) return;
    if (reason.trim().length < 10) {
      toast.error('Cancellation reason must be at least 10 characters.');
      return;
    }
    try {
      await cancelMutation.mutateAsync({ id, reason: reason.trim() });
      toast.success('Consultation cancelled successfully.');
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to cancel consultation.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load consultations"
        message="Please retry in a moment."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Consultations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track upcoming, active, and past consultations.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              status === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {consultations.length === 0 ? (
        <EmptyState
          title="No consultations found"
          message="Book a consultation to start your treatment journey."
          action={{
            label: 'Find Doctors',
            onClick: () => {
              window.location.href = ROUTES.patient.doctors;
            },
          }}
        />
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => {
            const canCancel = c.status === 'Pending' || c.status === 'Confirmed';
            const canJoin = c.consultationType === 'Video' && (c.status === 'Confirmed' || c.status === 'InProgress');
            return (
              <div key={c.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{c.doctorName}</p>
                    <p className="text-xs text-muted-foreground">{c.doctorSpecialization ?? 'General Physician'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.scheduledDate} • {c.startTime} - {c.endTime}
                    </p>
                  </div>
                  <span className="rounded-full border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {c.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={ROUTES.patient.consultationDetail(c.id)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    View Details
                  </Link>
                  {canJoin && (
                    <span className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground">
                      Open details to join call
                    </span>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => handleCancel(c.id)}
                      disabled={cancelMutation.isPending}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ConsultationHistoryPage() {
  return (
    <PatientGuard>
      <PatientConsultationHistoryContent />
    </PatientGuard>
  );
}

