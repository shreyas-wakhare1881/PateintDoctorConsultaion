'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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

type Tab = 'requests' | 'schedule';

function DoctorConsultationsContent() {
  const { isLoading: gateLoading, isApproved } = useDoctorStatusGate();
  const [tab, setTab] = useState<Tab>('requests');

  const requestsQuery = useDoctorConsultationRequests({ page: 1, pageSize: 20 });
  const scheduleQuery = useDoctorSchedule({ page: 1, pageSize: 20 });

  const confirmMutation = useConfirmConsultation();
  const rejectMutation = useRejectConsultation();
  const startMutation = useStartConsultation();
  const completeMutation = useCompleteConsultation();

  if (gateLoading || !isApproved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const activeQuery = tab === 'requests' ? requestsQuery : scheduleQuery;
  const items = activeQuery.data?.items ?? [];

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter rejection reason (minimum 10 characters)');
    if (!reason) return;
    if (reason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters.');
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id, reason: reason.trim() });
      toast.success('Consultation rejected.');
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to reject consultation.');
    }
  };

  const handleComplete = async (id: string) => {
    const notes = window.prompt('Add optional consultation notes (leave blank if none).') ?? undefined;
    try {
      await completeMutation.mutateAsync({ id, notes: notes?.trim() || undefined });
      toast.success('Consultation marked completed.');
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to complete consultation.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Consultations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage booking requests and active schedule.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${tab === 'requests' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:bg-muted'}`}
        >
          Pending Requests
        </button>
        <button
          type="button"
          onClick={() => setTab('schedule')}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${tab === 'schedule' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:bg-muted'}`}
        >
          Confirmed / In Progress
        </button>
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
            return (
              <div key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.patientName}</p>
                    <p className="text-xs text-muted-foreground">{item.consultationNumber}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.scheduledDate} • {item.startTime} - {item.endTime}
                    </p>
                  </div>
                  <span className="rounded-full border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {item.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={ROUTES.doctor.consultationDetail(item.id)}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
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
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        disabled={rejectMutation.isPending}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {canStart && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await startMutation.mutateAsync(item.id);
                          toast.success('Consultation started.');
                        } catch (err) {
                          toast.error(parseApiError(err).message ?? 'Failed to start consultation.');
                        }
                      }}
                      disabled={startMutation.isPending}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      Start
                    </button>
                  )}

                  {canComplete && (
                    <button
                      type="button"
                      onClick={() => handleComplete(item.id)}
                      disabled={completeMutation.isPending}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      Complete
                    </button>
                  )}

                  {canJoin && (
                    <span className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground">
                      Open details to join call
                    </span>
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

export default function DoctorConsultationsPage() {
  return (
    <DoctorGuard>
      <DoctorConsultationsContent />
    </DoctorGuard>
  );
}

