'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
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

// ── Edit dialog state ─────────────────────────────────────────────────────────

interface EditDialogState {
  open: boolean;
  slot: DoctorAvailabilitySlot | null;
  startTime: string;
  endTime: string;
  duration: number;
}

interface DeleteDialogState {
  open: boolean;
  slotId: string;
  slotLabel: string;
}

const EDIT_CLOSED: EditDialogState = { open: false, slot: null, startTime: '', endTime: '', duration: 30 };
const DELETE_CLOSED: DeleteDialogState = { open: false, slotId: '', slotLabel: '' };

// ── Input style ───────────────────────────────────────────────────────────────
const inputCls = 'h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition-colors';

function DoctorAvailabilityContent() {
  const { isLoading: gateLoading, isApproved } = useDoctorStatusGate();
  const { data, isLoading, isError } = useDoctorAvailability();
  const addMutation = useAddAvailabilitySlot();
  const updateMutation = useUpdateAvailabilitySlot();
  const deleteMutation = useDeleteAvailabilitySlot();

  // ── Add slot form state ───────────────────────────────────────────────────
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [duration, setDuration] = useState(30);

  // ── Edit / Delete dialog state ────────────────────────────────────────────
  const [editDialog, setEditDialog] = useState<EditDialogState>(EDIT_CLOSED);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(DELETE_CLOSED);

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

  const openEditDialog = (slot: DoctorAvailabilitySlot) => {
    setEditDialog({
      open: true,
      slot,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.slotDurationMinutes,
    });
  };

  const handleEditConfirm = async () => {
    if (!editDialog.slot) return;
    if (editDialog.duration <= 0 || isNaN(editDialog.duration)) {
      toast.error('Invalid slot duration.');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        slotId: editDialog.slot.id,
        data: {
          startTime: editDialog.startTime,
          endTime: editDialog.endTime,
          slotDurationMinutes: editDialog.duration,
        },
      });
      toast.success('Slot updated.');
      setEditDialog(EDIT_CLOSED);
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to edit slot.');
    }
  };

  const openDeleteDialog = (slot: DoctorAvailabilitySlot) => {
    const label = `${DAYS[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`} ${slot.startTime} – ${slot.endTime}`;
    setDeleteDialog({ open: true, slotId: slot.id, slotLabel: label });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(deleteDialog.slotId);
      toast.success('Slot deleted.');
      setDeleteDialog(DELETE_CLOSED);
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to delete slot.');
    }
  };

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", letterSpacing: '-0.01em' }}
    >
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.03em' }}>Availability Management</h1>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
            Maintain your weekly consultation slots. Overlap and ownership validation is enforced by the backend.
          </p>
        </div>

        {/* ── Add Slot Form ──────────────────────────────────────────────────── */}
        <form
          onSubmit={handleCreate}
          style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(18px) saturate(180%)', WebkitBackdropFilter: 'blur(18px) saturate(180%)', border: '1px solid rgba(255,255,255,0.45)', boxShadow: '0 8px 32px rgba(48,79,109,0.09)', borderRadius: 20, padding: 24 }}
        >
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#899481' }}>Add Availability Slot</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>Day</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className={inputCls}>
                {DAYS.map((day, idx) => (<option key={day} value={idx}>{day}</option>))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>Duration (min)</label>
              <input type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls} required />
            </div>
          </div>
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl px-6 text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all"
            style={{ background: '#E07D54', color: '#000000', boxShadow: '0 4px 12px rgba(224,125,84,0.30)' }}
          >
            {addMutation.isPending ? 'Saving…' : 'Add Slot'}
          </button>
        </form>

        {/* ── Slots List ────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center"><Spinner size="lg" /></div>
        ) : isError ? (
          <EmptyState title="Failed to load availability" message="Please retry." />
        ) : slots.length === 0 ? (
          <EmptyState title="No slots yet" message="Add your first availability slot to start receiving bookings." />
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(18px) saturate(180%)', WebkitBackdropFilter: 'blur(18px) saturate(180%)', border: '1px solid rgba(255,255,255,0.45)', boxShadow: '0 8px 32px rgba(48,79,109,0.09)', borderRadius: 20, overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(48,79,109,0.08)', background: 'rgba(48,79,109,0.04)' }}>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Day</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Time</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Duration</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Status</th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot, idx) => (
                    <tr
                      key={slot.id}
                      style={{
                        borderBottom: idx < slots.length - 1 ? '1px solid rgba(48,79,109,0.07)' : undefined,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,225,160,0.18)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                      <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: '#1F2937' }}>{DAYS[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`}</td>
                      <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: '#6B7280' }}>{slot.startTime} – {slot.endTime}</td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: '#6B7280' }}>{slot.slotDurationMinutes} min</td>
                      <td className="px-5 py-3.5 text-sm">
                        <span
                          className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={slot.isAvailable
                            ? { background: 'rgba(137,148,129,0.15)', color: '#596550' }
                            : { background: 'rgba(107,114,128,0.08)', color: '#6B7280' }
                          }
                        >
                          {slot.isAvailable ? 'Available' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(slot)}
                            disabled={updateMutation.isPending}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 transition-all hover:opacity-80"
                            style={{ background: 'rgba(48,79,109,0.07)', color: '#304F6D', border: '1px solid rgba(48,79,109,0.12)' }}
                          >
                            {slot.isAvailable ? 'Hide' : 'Show'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditDialog(slot)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-80"
                            style={{ background: 'rgba(255,225,160,0.30)', color: '#8a6a00', border: '1px solid rgba(224,158,0,0.20)' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteDialog(slot)}
                            className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all hover:opacity-80"
                            style={{ background: 'rgba(239,68,68,0.07)', color: '#991B1B', border: '1px solid rgba(239,68,68,0.20)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* ── Edit Dialog ────────────────────────────────────────────────────── */}
      <Dialog.Root open={editDialog.open} onOpenChange={(o) => !o && setEditDialog(EDIT_CLOSED)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="text-lg font-semibold text-foreground">Edit Slot</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {editDialog.slot ? `${DAYS[editDialog.slot.dayOfWeek] ?? ''} — update times and duration.` : ''}
            </Dialog.Description>
            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Start Time</label>
                <input type="time" value={editDialog.startTime} onChange={(e) => setEditDialog((s) => ({ ...s, startTime: e.target.value }))} className={inputCls + ' w-full'} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">End Time</label>
                <input type="time" value={editDialog.endTime} onChange={(e) => setEditDialog((s) => ({ ...s, endTime: e.target.value }))} className={inputCls + ' w-full'} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
                <input type="number" min={5} step={5} value={editDialog.duration} onChange={(e) => setEditDialog((s) => ({ ...s, duration: Number(e.target.value) }))} className={inputCls + ' w-full'} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditDialog(EDIT_CLOSED)} disabled={updateMutation.isPending} className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleEditConfirm} disabled={updateMutation.isPending} className="rounded-xl px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50" style={{ background: '#304F6D', color: '#FFFFFF' }}>{updateMutation.isPending ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────── */}
      <Dialog.Root open={deleteDialog.open} onOpenChange={(o) => !o && setDeleteDialog(DELETE_CLOSED)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="text-lg font-semibold text-foreground">Delete Slot</Dialog.Title>
            <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
              Are you sure you want to delete the slot <span className="font-medium text-foreground">{deleteDialog.slotLabel}</span>? This cannot be undone.
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteDialog(DELETE_CLOSED)} disabled={deleteMutation.isPending} className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending} className="rounded-xl px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.90)', color: '#FFFFFF' }}>{deleteMutation.isPending ? 'Deleting…' : 'Delete Slot'}</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      </div>
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

