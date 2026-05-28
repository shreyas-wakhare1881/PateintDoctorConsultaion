'use client';

import type { PrescriptionDto } from '@/modules/prescription/types/prescription.types';

interface Props {
  prescription: PrescriptionDto;
}

export function PrescriptionViewer({ prescription }: Props) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Prescription
        </h2>
        <span className="text-xs text-muted-foreground">
          {new Date(prescription.issuedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {prescription.diagnosis && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Diagnosis</p>
          <p className="mt-0.5 text-sm text-foreground">{prescription.diagnosis}</p>
        </div>
      )}

      {prescription.generalInstructions && (
        <div>
          <p className="text-xs font-medium text-muted-foreground">General Instructions</p>
          <p className="mt-0.5 text-sm text-foreground">{prescription.generalInstructions}</p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Medicines
        </p>
        <div className="space-y-2">
          {prescription.items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border bg-background px-4 py-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground">
                  {index + 1}. {item.medicineName}
                </p>
                {item.dosage && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.dosage}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {item.frequency && <span>Frequency: {item.frequency}</span>}
                {item.duration && <span>Duration: {item.duration}</span>}
              </div>
              {item.instructions && (
                <p className="mt-1 text-xs text-muted-foreground italic">
                  {item.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
