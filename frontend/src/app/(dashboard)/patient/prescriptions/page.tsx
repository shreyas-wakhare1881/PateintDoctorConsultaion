'use client';

import Link from 'next/link';
import { PatientGuard } from '@/guards/patient.guard';
import { Spinner } from '@/components/shared/spinner';
import { ROUTES } from '@/config/routes';
import { useMyPrescriptions } from '@/modules/prescription/hooks/usePrescription';

function MyPrescriptionsContent() {
  const { data: prescriptions, isLoading, isError } = useMyPrescriptions();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-700">Failed to load prescriptions. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Prescriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All prescriptions issued by your doctors.
        </p>
      </div>

      {!prescriptions || prescriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <svg
            className="mx-auto h-10 w-10 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <p className="mt-3 text-sm font-medium text-muted-foreground">No prescriptions yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Prescriptions will appear here after your doctor completes a consultation.
          </p>
          <Link
            href={ROUTES.patient.consultations}
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            View Consultations
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="rounded-xl border bg-card p-5 shadow-sm space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {prescription.diagnosis ?? 'Prescription'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Issued on{' '}
                    {new Date(prescription.issuedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <Link
                  href={ROUTES.patient.consultationDetail(prescription.consultationId)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  View Consultation →
                </Link>
              </div>

              {/* General instructions */}
              {prescription.generalInstructions && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                  {prescription.generalInstructions}
                </p>
              )}

              {/* Medicines */}
              <div className="space-y-1.5">
                {prescription.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-background px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-foreground">
                      {index + 1}. {item.medicineName}
                    </span>
                    {item.dosage && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                        {item.dosage}
                      </span>
                    )}
                    {item.frequency && (
                      <span className="text-muted-foreground">{item.frequency}</span>
                    )}
                    {item.duration && (
                      <span className="text-muted-foreground">· {item.duration}</span>
                    )}
                    {item.instructions && (
                      <span className="w-full text-muted-foreground italic mt-0.5">
                        {item.instructions}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatientPrescriptionsPage() {
  return (
    <PatientGuard>
      <MyPrescriptionsContent />
    </PatientGuard>
  );
}
