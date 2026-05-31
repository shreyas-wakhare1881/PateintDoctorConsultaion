'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { DoctorGuard } from '@/guards/doctor.guard';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useCompleteConsultation,
  useConfirmConsultation,
  useDoctorConsultationRequests,
  useDoctorSchedule,
  useRejectConsultation,
  useStartConsultation,
} from '@/modules/consultation/hooks/useConsultation';
import { useDoctorStatusGate } from '@/modules/doctor/hooks/useDoctor';
import { parseApiError } from '@/utils/errors';
import { ROUTES } from '@/config/routes';
import { cn } from '@/utils/cn';

type Tab = 'requests' | 'schedule';

// ── Dialog state types ────────────────────────────────────────────────────────

interface RejectDialogState {
  open: boolean;
  consultationId: string;
  patientName: string;
  reason: string;
  touched: boolean;
}

interface CompleteDialogState {
  open: boolean;
  consultationId: string;
  patientName: string;
  notes: string;
}

const REJECT_DIALOG_CLOSED: RejectDialogState = {
  open: false,
  consultationId: '',
  patientName: '',
  reason: '',
  touched: false,
};

const COMPLETE_DIALOG_CLOSED: CompleteDialogState = {
  open: false,
  consultationId: '',
  patientName: '',
  notes: '',
};

function DoctorConsultationsContent() {
  const { isLoading: gateLoading, isApproved } = useDoctorStatusGate();
  const [tab, setTab] = useState<Tab>('requests');

  const requestsQuery = useDoctorConsultationRequests({ page: 1, pageSize: 20 });
  const scheduleQuery = useDoctorSchedule({ page: 1, pageSize: 20 });

  const confirmMutation = useConfirmConsultation();
  const rejectMutation = useRejectConsultation();
  const startMutation = useStartConsultation();
  const completeMutation = useCompleteConsultation();

  const [rejectDialog, setRejectDialog] = useState<RejectDialogState>(REJECT_DIALOG_CLOSED);
  const [completeDialog, setCompleteDialog] = useState<CompleteDialogState>(COMPLETE_DIALOG_CLOSED);

  if (gateLoading || !isApproved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeQuery = tab === 'requests' ? requestsQuery : scheduleQuery;
  const items = activeQuery.data?.items ?? [];

  // ── Reject handler ──────────────────────────────────────────────────────────
  const handleRejectConfirm = async () => {
    if (rejectDialog.reason.trim().length < 10) {
      setRejectDialog((s) => ({ ...s, touched: true }));
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        id: rejectDialog.consultationId,
        reason: rejectDialog.reason.trim(),
      });
      toast.success('Consultation rejected.');
      setRejectDialog(REJECT_DIALOG_CLOSED);
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to reject consultation.');
    }
  };

  // ── Complete handler ────────────────────────────────────────────────────────
  const handleCompleteConfirm = async () => {
    try {
      await completeMutation.mutateAsync({
        id: completeDialog.consultationId,
        notes: completeDialog.notes.trim() || undefined,
      });
      toast.success('Consultation marked completed.');
      setCompleteDialog(COMPLETE_DIALOG_CLOSED);
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to complete consultation.');
    }
  };

  const reasonTooShort = rejectDialog.touched && rejectDialog.reason.trim().length < 10;

  const GLASS: React.CSSProperties = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(18px) saturate(180%)',
    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.45)',
    boxShadow: '0 8px 32px rgba(48,79,109,0.09)',
    borderRadius: 18,
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    Pending:    { bg: 'rgba(255,225,160,0.35)', color: '#8a6a00'  },
    Confirmed:  { bg: 'rgba(48,79,109,0.12)',   color: '#304F6D'  },
    InProgress: { bg: 'rgba(224,125,84,0.15)',  color: '#b85c30'  },
    Completed:  { bg: 'rgba(137,148,129,0.15)', color: '#596550'  },
    Rejected:   { bg: 'rgba(239,68,68,0.10)',   color: '#991B1B'  },
    Cancelled:  { bg: 'rgba(107,114,128,0.12)', color: '#4B5563'  },
  };

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", letterSpacing: '-0.01em' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.03em' }}>Consultations</h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Manage booking requests and active schedule.</p>
      </div>

      {/* Tab pills */}
      <div className="mb-5 inline-flex gap-1 rounded-2xl p-1" style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.40)' }}>
        {(['requests', 'schedule'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
            style={
              tab === t
                ? { background: '#304F6D', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(48,79,109,0.25)' }
                : { color: '#6B7280' }
            }
          >
            {t === 'requests' ? 'Pending Requests' : 'Confirmed / In Progress'}
          </button>
        ))}
      </div>

      {activeQuery.isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : activeQuery.isError ? (
        <EmptyState title="Failed to load consultations" message="Please try again." />
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === 'requests' ? 'No pending requests' : 'No active consultations'}
          message={tab === 'requests' ? 'New patient bookings will appear here.' : 'Confirmed and in-progress consultations appear here.'}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const canStart = item.status === 'Confirmed';
            const canComplete = item.status === 'InProgress';
            const canJoin = item.consultationType === 'Video' && (item.status === 'Confirmed' || item.status === 'InProgress');
            const sc = statusColors[item.status] ?? { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' };
            const patientInitials = item.patientName?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'P';
            return (
              <div
                key={item.id}
                style={{ ...GLASS, padding: 20, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.13)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.09)'; }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Patient avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: '#304F6D' }}>
                      {patientInitials}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#1F2937' }}>{item.patientName}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{item.consultationNumber}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <svg className="h-3 w-3" style={{ color: '#899481' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                        <span className="text-xs" style={{ color: '#6B7280' }}>{item.scheduledDate} · {item.startTime} – {item.endTime}</span>
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={ROUTES.doctor.consultationDetail(item.id)}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(48,79,109,0.07)', color: '#304F6D', border: '1px solid rgba(48,79,109,0.12)' }}
                  >
                    View Details
                  </Link>

                  {tab === 'requests' && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await confirmMutation.mutateAsync(item.id);
                            toast.success('Consultation confirmed.');
                          } catch (err) {
                            toast.error(parseApiError(err).message ?? 'Failed to confirm consultation.');
                          }
                        }}
                        disabled={confirmMutation.isPending}
                        className="rounded-xl px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                        style={{ background: '#304F6D', boxShadow: '0 2px 8px rgba(48,79,109,0.25)' }}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectDialog({ open: true, consultationId: item.id, patientName: item.patientName, reason: '', touched: false })}
                        className="rounded-xl border px-3 py-1.5 text-xs font-medium hover:opacity-90"
                        style={{ borderColor: 'rgba(239,68,68,0.30)', background: 'rgba(239,68,68,0.06)', color: '#991B1B' }}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {canStart && (
                    <button
                      type="button"
                      onClick={async () => {
                        try { await startMutation.mutateAsync(item.id); toast.success('Consultation started.'); }
                        catch (err) { toast.error(parseApiError(err).message ?? 'Failed to start consultation.'); }
                      }}
                      disabled={startMutation.isPending}
                      className="rounded-xl px-3 py-1.5 text-xs font-bold text-black hover:opacity-90 disabled:opacity-60"
                      style={{ background: '#E07D54', boxShadow: '0 2px 8px rgba(224,125,84,0.30)' }}
                    >
                      Start
                    </button>
                  )}

                  {canComplete && (
                    <button
                      type="button"
                      onClick={() => setCompleteDialog({ open: true, consultationId: item.id, patientName: item.patientName, notes: '' })}
                      className="rounded-xl px-3 py-1.5 text-xs font-bold hover:opacity-90"
                      style={{ background: 'rgba(137,148,129,0.18)', color: '#304F6D', border: '1px solid rgba(137,148,129,0.30)' }}
                    >
                      Complete
                    </button>
                  )}

                  {canJoin && (
                    <Link
                      href={ROUTES.doctor.consultationDetail(item.id)}
                      className="rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background: '#304F6D', boxShadow: '0 2px 8px rgba(48,79,109,0.25)' }}
                    >
                      Join Call →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reject Dialog ───────────────────────────────────────────────────── */}
      <Dialog.Root
        open={rejectDialog.open}
        onOpenChange={(o) => !o && setRejectDialog(REJECT_DIALOG_CLOSED)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Reject Consultation
            </Dialog.Title>
            <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
              Provide a reason for rejecting {rejectDialog.patientName}&apos;s booking. This will be recorded.
            </Dialog.Description>

            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">
                Rejection Reason <span className="text-destructive">*</span>
              </label>
              <textarea
                value={rejectDialog.reason}
                onChange={(e) =>
                  setRejectDialog((s) => ({ ...s, reason: e.target.value, touched: true }))
                }
                placeholder="Minimum 10 characters — e.g. Slot not available on requested date."
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
                {rejectDialog.reason.length}/500
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectDialog(REJECT_DIALOG_CLOSED)}
                disabled={rejectMutation.isPending}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={rejectMutation.isPending}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Complete Dialog ─────────────────────────────────────────────────── */}
      <Dialog.Root
        open={completeDialog.open}
        onOpenChange={(o) => !o && setCompleteDialog(COMPLETE_DIALOG_CLOSED)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Complete Consultation
            </Dialog.Title>
            <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
              Mark consultation with {completeDialog.patientName} as completed. Optionally add clinical notes.
            </Dialog.Description>

            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground">
                Consultation Notes <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <textarea
                value={completeDialog.notes}
                onChange={(e) =>
                  setCompleteDialog((s) => ({ ...s, notes: e.target.value }))
                }
                placeholder="Patient presented with… Diagnosis: … Treatment plan: …"
                rows={4}
                maxLength={2000}
                className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {completeDialog.notes.length}/2000
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompleteDialog(COMPLETE_DIALOG_CLOSED)}
                disabled={completeMutation.isPending}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteConfirm}
                disabled={completeMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {completeMutation.isPending ? 'Completing…' : 'Mark Completed'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default function DoctorConsultationsPage() {
  return (
    <DoctorGuard>
      <DoctorConsultationsContent />
    </DoctorGuard>
  );
}

