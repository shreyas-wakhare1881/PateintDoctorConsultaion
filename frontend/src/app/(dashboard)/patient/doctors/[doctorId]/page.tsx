'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PatientGuard } from '@/guards/patient.guard';
import { usePublicDoctorById } from '@/modules/doctor/hooks/useDoctor';
import { ROUTES } from '@/config/routes';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DoctorDetailContent() {
  const params = useParams<{ doctorId: string }>();
  const doctorId = params?.doctorId ?? '';
  const { data: doctor, isLoading, isError } = usePublicDoctorById(doctorId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{doctor.fullName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {doctor.specialization ?? 'General Physician'}
          </p>
        </div>
        <Link
          href={ROUTES.patient.doctors}
          className="rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Back to Doctors
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Experience</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {doctor.experienceYears != null ? `${doctor.experienceYears} years` : '—'}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Consultation Fee</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {doctor.consultationFee != null ? `INR ${doctor.consultationFee}` : '—'}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {doctor.rating != null ? `${doctor.rating.toFixed(1)} / 5` : 'No ratings yet'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">About</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/90">{doctor.bio ?? 'No bio shared yet.'}</p>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Qualification</dt>
            <dd className="font-medium text-foreground">{doctor.qualification ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Hospital</dt>
            <dd className="font-medium text-foreground">{doctor.hospitalName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Location</dt>
            <dd className="font-medium text-foreground">{[doctor.city, doctor.state, doctor.country].filter(Boolean).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Languages</dt>
            <dd className="font-medium text-foreground">
              {doctor.languagesSpoken.length > 0 ? doctor.languagesSpoken.join(', ') : '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Weekly Availability</h2>
        {doctor.availability.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No public availability slots are published right now.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {doctor.availability.map((slot, idx) => (
              <div key={`${slot.dayOfWeek}-${slot.startTime}-${idx}`} className="rounded-lg border bg-background px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{DAY_NAMES[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`}</p>
                <p className="text-muted-foreground">
                  {slot.startTime} - {slot.endTime}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href={ROUTES.patient.book(doctor.id)}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Book Consultation
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
