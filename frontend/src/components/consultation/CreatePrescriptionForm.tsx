'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCreatePrescription } from '@/modules/prescription/hooks/usePrescription';
import type { CreatePrescriptionItemRequest } from '@/modules/prescription/types/prescription.types';
import { parseApiError } from '@/utils/errors';

interface Props {
  consultationId: string;
  onCreated: () => void;
}

// Internal item type — adds a stable React key that is NOT sent to the API
type ItemWithKey = CreatePrescriptionItemRequest & { _key: string };

const emptyItem = (): ItemWithKey => ({
  _key: crypto.randomUUID(),
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
});

export function CreatePrescriptionForm({ consultationId, onCreated }: Props) {
  const createMutation = useCreatePrescription();
  // Guard against duplicate submissions (double-click, slow network)
  const submittingRef = useRef(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [items, setItems] = useState<ItemWithKey[]>([emptyItem()]);

  const updateItem = (key: string, field: keyof CreatePrescriptionItemRequest, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item._key === key ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((item) => item._key !== key));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submittingRef.current) return;
    submittingRef.current = true;

    const validItems = items.filter((i) => i.medicineName.trim());
    if (validItems.length === 0) {
      toast.error('At least one medicine with a name is required.');
      submittingRef.current = false;
      return;
    }

    try {
      await createMutation.mutateAsync({
        consultationId,
        data: {
          diagnosis: diagnosis.trim() || undefined,
          generalInstructions: generalInstructions.trim() || undefined,
          items: validItems.map((i) => ({
            medicineName: i.medicineName.trim(),
            dosage: i.dosage.trim(),
            frequency: i.frequency.trim(),
            duration: i.duration.trim(),
            instructions: i.instructions?.trim() || undefined,
          })),
        },
      });
      toast.success('Prescription created successfully.');
      onCreated();
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to create prescription.');
      submittingRef.current = false;
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Write Prescription
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Viral fever, Hypertension"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            General Instructions
          </label>
          <textarea
            value={generalInstructions}
            onChange={(e) => setGeneralInstructions(e.target.value)}
            rows={2}
            placeholder="Rest well, drink plenty of water..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Medicines
            </p>
            <button
              type="button"
              onClick={addItem}
              className="text-xs font-medium text-primary hover:underline"
            >
              + Add Medicine
            </button>
          </div>

          {items.map((item, index) => (
            // _key is a stable UUID — no reconciliation issues on remove
            <div key={item._key} className="rounded-lg border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Medicine #{index + 1}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item._key)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  value={item.medicineName}
                  onChange={(e) => updateItem(item._key, 'medicineName', e.target.value)}
                  placeholder="Medicine name *"
                  className="rounded-lg border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <input
                  type="text"
                  value={item.dosage}
                  onChange={(e) => updateItem(item._key, 'dosage', e.target.value)}
                  placeholder="Dosage (e.g. 500mg)"
                  className="rounded-lg border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  value={item.frequency}
                  onChange={(e) => updateItem(item._key, 'frequency', e.target.value)}
                  placeholder="Frequency (e.g. Twice daily)"
                  className="rounded-lg border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  value={item.duration}
                  onChange={(e) => updateItem(item._key, 'duration', e.target.value)}
                  placeholder="Duration (e.g. 5 days)"
                  className="rounded-lg border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <input
                type="text"
                value={item.instructions ?? ''}
                onChange={(e) => updateItem(item._key, 'instructions', e.target.value)}
                placeholder="Special instructions (optional)"
                className="w-full rounded-lg border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {createMutation.isPending ? 'Saving…' : 'Save Prescription'}
        </button>
      </form>
    </div>
  );
}
