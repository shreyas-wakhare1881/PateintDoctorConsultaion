'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PatientGuard } from '@/guards/patient.guard';
import { usePublicDoctorById } from '@/modules/doctor/hooks/useDoctor';
import { ROUTES } from '@/config/routes';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(18px) saturate(180%)',
  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.45)',
  boxShadow: '0 8px 32px rgba(48,79,109,0.09)',
  borderRadius: 20,
};

function DoctorDetailContent() {
  const params = useParams<{ doctorId: string }>();
  const doctorId = params?.doctorId ?? '';
  const { data: doctor, isLoading, isError } = usePublicDoctorById(doctorId);

  if (isLoading) {
    return (
      <div
        className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8"
        style={{ background: '#E6E1DD', minHeight: '100%' }}
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isError || !doctor) {
    return (
      <EmptyState
        title="Doctor not found"
        message="This profile is unavailable or no longer publicly listed."
      />
    );
  }

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10 space-y-5"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", letterSpacing: '-0.01em' }}
    >
      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <div style={GLASS} className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <DoctorAvatar
            seed={doctor.id}
            profileImageUrl={doctor.profileImageUrl}
            name={doctor.fullName}
            size={120}
            style={{
              border: '3px solid rgba(255,255,255,0.60)',
              boxShadow: '0 8px 32px rgba(48,79,109,0.18)',
            }}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.03em' }}>
              {doctor.fullName}
            </h1>
            <span
              className="inline-block mt-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: '#E2F3FD', color: '#304F6D' }}
            >
              {doctor.specialization ?? 'General Physician'}
            </span>
            {doctor.qualification && (
              <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>{doctor.qualification}</p>
            )}
            {doctor.hospitalName && (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium" style={{ color: '#304F6D' }}>
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                </svg>
                {doctor.hospitalName}
              </p>
            )}
          </div>

          {/* Back button */}
          <Link
            href={ROUTES.patient.doctors}
            className="shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:opacity-80"
            style={{ color: '#6B7280', borderColor: 'rgba(48,79,109,0.15)', background: 'rgba(255,255,255,0.60)' }}
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Experience', value: doctor.experienceYears != null ? `${doctor.experienceYears} yrs` : '—' },
          { label: 'Fee', value: doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '—' },
          { label: 'Rating', value: doctor.rating != null ? `${doctor.rating.toFixed(1)} / 5` : '—' },
        ].map((s) => (
          <div key={s.label} style={{ ...GLASS, padding: '14px 16px' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="mt-1 text-lg font-bold" style={{ color: '#304F6D', letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <div style={GLASS} className="p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>About</h2>
        <p className="text-sm leading-6" style={{ color: '#1F2937' }}>{doctor.bio ?? 'No bio shared yet.'}</p>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {[
            { label: 'Location', value: [doctor.city, doctor.state, doctor.country].filter(Boolean).join(', ') || '—' },
            { label: 'Languages', value: doctor.languagesSpoken.length > 0 ? doctor.languagesSpoken.join(', ') : '—' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3" style={{ background: 'rgba(48,79,109,0.04)' }}>
              <dt className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>{item.label}</dt>
              <dd className="mt-0.5 font-semibold" style={{ color: '#1F2937' }}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ── Availability ───────────────────────────────────────────────── */}
      <div style={GLASS} className="p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6B7280' }}>Weekly Availability</h2>
        {doctor.availability.length === 0 ? (
          <p className="text-sm" style={{ color: '#6B7280' }}>No public availability slots are published right now.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {doctor.availability.map((slot, idx) => (
              <div
                key={`${slot.dayOfWeek}-${slot.startTime}-${idx}`}
                className="rounded-xl px-3 py-2 text-sm"
                style={{ background: 'rgba(48,79,109,0.04)', border: '1px solid rgba(48,79,109,0.08)' }}
              >
                <p className="font-bold" style={{ color: '#304F6D' }}>{DAY_NAMES[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`}</p>
                <p style={{ color: '#6B7280' }}>{slot.startTime} – {slot.endTime}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Link
          href={ROUTES.patient.book(doctor.id)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#E07D54', color: '#000000', boxShadow: '0 4px 16px rgba(224,125,84,0.35)' }}
        >
          Book Consultation →
        </Link>
      </div>
    </div>
  );
}

export default function PatientDoctorDetailPage() {
  return (
    <PatientGuard>
      <DoctorDetailContent />
    </PatientGuard>
  );
}
