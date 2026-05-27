'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { DoctorGuard } from '@/guards/doctor.guard';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';
import {
  useAddAvailabilitySlot,
  useDeleteAvailabilitySlot,
  useDoctorAvailability,
  useDoctorStatusGate,
  useUpdateAvailabilitySlot,
} from '@/modules/doctor/hooks/useDoctor';
import type { DoctorAvailabilitySlot } from '@/modules/doctor/types/doctor.types';
import { parseApiError } from '@/utils/errors';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function DoctorAvailabilityContent() {
  const { isLoading: gateLoading, isApproved } = useDoctorStatusGate();
  const { data, isLoading, isError } = useDoctorAvailability();
  const addMutation = useAddAvailabilitySlot();
  const updateMutation = useUpdateAvailabilitySlot();
  const deleteMutation = useDeleteAvailabilitySlot();

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [duration, setDuration] = useState(30);

  if (gateLoading || !isApproved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const slots: DoctorAvailabilitySlot[] = data ?? [];

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addMutation.mutateAsync({
        dayOfWeek,
        startTime,
        endTime,
        slotDurationMinutes: duration,
      });
      toast.success('Availability slot added.');
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to add slot.');
    }
  };

  const handleToggle = async (slot: DoctorAvailabilitySlot) => {
    try {
      await updateMutation.mutateAsync({
        slotId: slot.id,
        data: { isAvailable: !slot.isAvailable },
      });
      toast.success('Availability updated.');
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to update slot.');
    }
  };

  const handleEdit = async (slot: DoctorAvailabilitySlot) => {
    const nextStart = window.prompt('Start time (HH:mm)', slot.startTime) ?? slot.startTime;
    const nextEnd = window.prompt('End time (HH:mm)', slot.endTime) ?? slot.endTime;
    const nextDurationRaw = window.prompt('Slot duration in minutes', String(slot.slotDurationMinutes)) ?? String(slot.slotDurationMinutes);
    const nextDuration = Number(nextDurationRaw);
    if (Number.isNaN(nextDuration) || nextDuration <= 0) {
      toast.error('Invalid slot duration.');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        slotId: slot.id,
        data: {
          startTime: nextStart,
          endTime: nextEnd,
          slotDurationMinutes: nextDuration,
        },
      });
      toast.success('Slot updated.');
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to edit slot.');
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await deleteMutation.mutateAsync(slotId);
      toast.success('Slot deleted.');
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to delete slot.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Availability Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maintain your weekly consultation slots. Overlap and ownership validation is enforced by backend.
        </p>
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Add Slot</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="h-10 rounded-lg border bg-background px-3 text-sm">
            {DAYS.map((day, idx) => (
              <option key={day} value={idx}>{day}</option>
            ))}
          </select>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm" required />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm" required />
          <input type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="h-10 rounded-lg border bg-background px-3 text-sm" required />
        </div>
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {addMutation.isPending ? 'Saving...' : 'Add Availability'}
        </button>
      </form>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Spinner size="lg" /></div>
      ) : isError ? (
        <EmptyState title="Failed to load availability" message="Please retry." />
      ) : slots.length === 0 ? (
        <EmptyState title="No slots yet" message="Add your first availability slot to start receiving bookings." />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Day</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-sm text-foreground">{DAYS[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{slot.startTime} - {slot.endTime}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{slot.slotDurationMinutes} min</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${slot.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {slot.isAvailable ? 'Available' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleToggle(slot)} className="rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted">
                        {slot.isAvailable ? 'Hide' : 'Show'}
                      </button>
                      <button type="button" onClick={() => handleEdit(slot)} className="rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(slot.id)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                        Delete
                      </button>
                    </div>
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

export default function DoctorAvailabilityPage() {
  return (
    <DoctorGuard>
      <DoctorAvailabilityContent />
    </DoctorGuard>
  );
}

