'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/utils/cn';

interface DialogBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'approve' | 'danger' | 'warning' | 'default';
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  isPending?: boolean;
  onConfirm: (reason: string) => void;
}

const CONFIRM_CLASSES: Record<string, string> = {
  approve: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  warning: 'bg-amber-600 text-white hover:bg-amber-700',
  default: 'bg-primary text-primary-foreground hover:opacity-90',
};

function ModerationDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  confirmVariant = 'default',
  requireReason = false,
  reasonLabel = 'Reason (optional)',
  reasonPlaceholder = 'Enter a reason…',
  isPending = false,
  onConfirm,
}: DialogBaseProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const reasonEmpty = requireReason && reason.trim().length === 0;

  const handleConfirm = () => {
    if (requireReason) setTouched(true);
    if (reasonEmpty) return;
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setTouched(false);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
            {description}
          </Dialog.Description>

          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground">
              {requireReason ? (
                <>
                  Reason <span className="text-red-500">*</span>
                </>
              ) : (
                reasonLabel
              )}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              maxLength={500}
              className={cn(
                'mt-1.5 w-full resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors',
                'focus:border-primary focus:ring-2 focus:ring-primary/30',
                touched && reasonEmpty ? 'border-red-400' : 'border-input'
              )}
            />
            {touched && reasonEmpty && (
              <p className="mt-1 text-xs text-red-500">Reason is required.</p>
            )}
            <p className="mt-1 text-right text-xs text-muted-foreground">{reason.length}/500</p>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || (requireReason && touched && reasonEmpty)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                CONFIRM_CLASSES[confirmVariant]
              )}
            >
              {isPending ? 'Processing…' : confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Specific Dialogs ──────────────────────────────────────────────────────────

interface SimpleDoctorDialogProps {
  open: boolean;
  onClose: () => void;
  doctorName: string;
  isPending?: boolean;
  onConfirm: (reason: string) => void;
}

export function ApproveDoctorDialog({ open, onClose, doctorName, isPending, onConfirm }: SimpleDoctorDialogProps) {
  return (
    <ModerationDialog
      open={open}
      onClose={onClose}
      title="Approve Doctor"
      description={`Approve ${doctorName}? Their profile will become publicly visible once approved.`}
      confirmLabel="Approve"
      confirmVariant="approve"
      requireReason={false}
      reasonLabel="Notes (optional)"
      reasonPlaceholder="License verified. Profile complete."
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}

export function RejectDoctorDialog({ open, onClose, doctorName, isPending, onConfirm }: SimpleDoctorDialogProps) {
  return (
    <ModerationDialog
      open={open}
      onClose={onClose}
      title="Reject Doctor"
      description={`Reject ${doctorName}'s application. A reason is required and will be recorded in the audit log.`}
      confirmLabel="Reject"
      confirmVariant="danger"
      requireReason={true}
      reasonPlaceholder="License number could not be verified with medical council."
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}

export function SuspendDoctorDialog({ open, onClose, doctorName, isPending, onConfirm }: SimpleDoctorDialogProps) {
  return (
    <ModerationDialog
      open={open}
      onClose={onClose}
      title="Suspend Doctor"
      description={`Suspend ${doctorName}? They will be removed from public search immediately.`}
      confirmLabel="Suspend"
      confirmVariant="warning"
      requireReason={true}
      reasonPlaceholder="License expired / compliance violation."
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}

export function ReactivateDoctorDialog({ open, onClose, doctorName, isPending, onConfirm }: SimpleDoctorDialogProps) {
  return (
    <ModerationDialog
      open={open}
      onClose={onClose}
      title="Reactivate Doctor"
      description={`Reactivate ${doctorName}? They will return to Approved status and become publicly visible.`}
      confirmLabel="Reactivate"
      confirmVariant="approve"
      requireReason={false}
      reasonLabel="Notes (optional)"
      reasonPlaceholder="Issue resolved. Reinstating account."
      isPending={isPending}
      onConfirm={onConfirm}
    />
  );
}
