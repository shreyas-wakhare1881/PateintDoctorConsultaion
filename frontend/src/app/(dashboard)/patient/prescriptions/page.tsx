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
      <div className="rounded-2xl border p-6 text-center" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
        <p className="text-sm font-medium" style={{ color: '#991B1B' }}>
          Failed to load prescriptions. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.02em' }}>
          My Prescriptions
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
          All prescriptions issued by your doctors.
        </p>
      </div>

      {!prescriptions || prescriptions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center"
          style={{ background: '#fff', borderColor: '#E2E8F0' }}
        >
          {/* Prescription icon */}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(48,79,109,0.10)' }}
          >
            <svg
              className="h-8 w-8"
              style={{ color: '#304F6D' }}
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
          </div>
          <p className="mt-4 font-semibold" style={{ color: '#1F2937' }}>No prescriptions yet</p>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
            Prescriptions will appear here after your doctor completes a consultation.
          </p>
          <Link
            href={ROUTES.patient.consultations}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #E07D54 0%, #d06843 100%)', boxShadow: '0 4px 12px rgba(224,125,84,0.35)' }}
          >
            View Consultations
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(48,79,109,0.10)', boxShadow: '0 4px 16px rgba(48,79,109,0.06)' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(137,148,129,0.15)' }}
                  >
                    <svg className="h-5 w-5" style={{ color: '#899481' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: '#1F2937', fontSize: 14 }}>
                      {prescription.diagnosis ?? 'Prescription'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                      Issued on{' '}
                      {new Date(prescription.issuedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <Link
                  href={ROUTES.patient.consultationDetail(prescription.consultationId)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: '#E2F3FD', color: '#304F6D' }}
                >
                  View Consultation →
                </Link>
              </div>

              {/* General instructions */}
              {prescription.generalInstructions && (
                <p
                  className="text-xs italic rounded-xl px-4 py-2.5"
                  style={{ background: 'rgba(226,243,253,0.60)', borderLeft: '3px solid #304F6D', color: '#6B7280' }}
                >
                  {prescription.generalInstructions}
                </p>
              )}

              {/* Medicines */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                  Medicines
                </p>
                {prescription.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl px-4 py-3 text-xs"
                    style={{ background: 'rgba(48,79,109,0.04)', border: '1px solid rgba(48,79,109,0.07)' }}
                  >
                    <span className="font-bold" style={{ color: '#1F2937' }}>
                      {index + 1}. {item.medicineName}
                    </span>
                    {item.dosage && (
                      <span
                        className="rounded-full px-2.5 py-0.5 font-semibold"
                        style={{ background: '#E2F3FD', color: '#304F6D' }}
                      >
                        {item.dosage}
                      </span>
                    )}
                    {item.frequency && (
                      <span style={{ color: '#6B7280' }}>{item.frequency}</span>
                    )}
                    {item.duration && (
                      <span style={{ color: '#6B7280' }}>· {item.duration}</span>
                    )}
                    {item.instructions && (
                      <span className="w-full italic mt-0.5" style={{ color: '#899481' }}>
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
