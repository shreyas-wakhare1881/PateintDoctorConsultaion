'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
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
import { cn } from '@/utils/cn';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';

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

// Maps consultation status to visual badge class
const STATUS_BADGE: Record<string, string> = {
  Pending:    'status-pending',
  Confirmed:  'status-confirmed',
  InProgress: 'status-inprogress',
  Completed:  'status-completed',
  Cancelled:  'status-cancelled',
  Rejected:   'status-rejected',
  NoShow:     'status-noshow',
};

interface CancelDialogState {
  open: boolean;
  consultationId: string;
  doctorName: string;
  reason: string;
  touched: boolean;
}

const CANCEL_DIALOG_CLOSED: CancelDialogState = {
  open: false,
  consultationId: '',
  doctorName: '',
  reason: '',
  touched: false,
};

function PatientConsultationHistoryContent() {
  const [status, setStatus] = useState<'' | ConsultationStatus>('');
  const { data, isLoading, isError } = useMyConsultations(
    status ? { status, page: 1, pageSize: 20 } : { page: 1, pageSize: 20 }
  );
  const cancelMutation = useCancelConsultation();
  const [cancelDialog, setCancelDialog] = useState<CancelDialogState>(CANCEL_DIALOG_CLOSED);

  const consultations = data?.items ?? [];

  const reasonTooShort = cancelDialog.touched && cancelDialog.reason.trim().length < 10;

  const handleCancelConfirm = async () => {
    if (cancelDialog.reason.trim().length < 10) {
      setCancelDialog((s) => ({ ...s, touched: true }));
      return;
    }
    try {
      await cancelMutation.mutateAsync({
        id: cancelDialog.consultationId,
        reason: cancelDialog.reason.trim(),
      });
      toast.success('Consultation cancelled successfully.');
      setCancelDialog(CANCEL_DIALOG_CLOSED);
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
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.02em' }}>
          My Consultations
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          Track upcoming, active, and past consultations.
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setStatus(f.value)}
            className="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150"
            style={
              status === f.value
                ? { background: '#304F6D', color: '#fff', borderColor: '#304F6D', boxShadow: '0 2px 8px rgba(48,79,109,0.25)' }
                : { background: 'rgba(255,255,255,0.70)', color: '#6B7280', borderColor: 'rgba(48,79,109,0.12)' }
            }
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
            onClick: () => { window.location.href = ROUTES.patient.doctors; },
          }}
        />
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => {
            const canCancel = c.status === 'Pending' || c.status === 'Confirmed';
            const canJoin = c.consultationType === 'Video' && (c.status === 'Confirmed' || c.status === 'InProgress');
            const badgeClass = STATUS_BADGE[c.status] ?? 'status-noshow';
            return (
              <div key={c.id} className="ds-card p-5" style={{ borderRadius: 14 }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* Left: doctor info */}
                  <div className="flex items-start gap-3">
                    {/* Doctor avatar */}
                    <DoctorAvatar
                      seed={c.doctorId ?? c.id}
                      name={c.doctorName ?? undefined}
                      size={40}
                      style={{ borderRadius: 12 }}
                    />
                    <div>
                      <p className="font-semibold" style={{ color: '#1F2937', fontSize: 14 }}>
                        {c.doctorName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                        {c.doctorSpecialization ?? 'General Physician'}
                      </p>
                      <p className="mt-1.5 text-xs" style={{ color: '#6B7280' }}>
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                          </svg>
                          {c.scheduledDate} · {c.startTime}–{c.endTime}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-bold', badgeClass)}>
                    {c.status === 'InProgress' ? 'In Progress' : c.status === 'NoShow' ? 'No Show' : c.status}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={ROUTES.patient.consultationDetail(c.id)}
                    className="rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 hover:opacity-80"
                    style={{ color: '#6B7280', borderColor: 'rgba(48,79,109,0.12)' }}
                  >
                    View Details
                  </Link>
                  {canJoin && (
                    <Link
                      href={ROUTES.patient.consultationDetail(c.id)}
                      className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #304F6D, #899481)', boxShadow: '0 4px 12px rgba(48,79,109,0.25)' }}
                    >
                      Join Call →
                    </Link>
                  )}
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() =>
                        setCancelDialog({
                          open: true,
                          consultationId: c.id,
                          doctorName: c.doctorName,
                          reason: '',
                          touched: false,
                        })
                      }
                      className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 hover:opacity-90"
                      style={{ background: '#FEE2E2', color: '#991B1B' }}
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

      {/* ── Cancel Dialog ──────────────────────────────────────────────────── */}
      <Dialog.Root
        open={cancelDialog.open}
        onOpenChange={(o) => !o && setCancelDialog(CANCEL_DIALOG_CLOSED)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Cancel Consultation
            </Dialog.Title>
            <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
              Please provide a reason for cancelling your consultation with <span className="font-medium text-foreground">{cancelDialog.doctorName}</span>.
            </Dialog.Description>

            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">
                Cancellation Reason <span className="text-destructive">*</span>
              </label>
              <textarea
                value={cancelDialog.reason}
                onChange={(e) =>
                  setCancelDialog((s) => ({ ...s, reason: e.target.value, touched: true }))
                }
                placeholder="Minimum 10 characters — e.g. Unable to attend due to schedule conflict."
                rows={3}
                maxLength={500}
                className={cn(
                  'mt-1.5 w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30',
                  reasonTooShort ? 'border-destructive' : 'border-input'
                )}
              />
              {reasonTooShort && (
                <p className="mt-1 text-xs text-destructive">
                  Reason must be at least 10 characters.
                </p>
              )}
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {cancelDialog.reason.length}/500
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelDialog(CANCEL_DIALOG_CLOSED)}
                disabled={cancelMutation.isPending}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelMutation.isPending}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Consultation'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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
