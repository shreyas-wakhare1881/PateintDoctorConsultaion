'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PatientGuard } from '@/guards/patient.guard';
import { Spinner } from '@/components/shared/spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ROUTES } from '@/config/routes';
import { usePublicDoctorById } from '@/modules/doctor/hooks/useDoctor';
import { useBookConsultation } from '@/modules/consultation/hooks/useConsultation';
import { parseApiError } from '@/utils/errors';

type ConsultationType = 'Video' | 'InPerson';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normalizeToSeconds(time: string): string {
  return /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time;
}

function BookConsultationContent() {
  const params = useParams<{ doctorId: string }>();
  const doctorId = params?.doctorId ?? '';
  const router = useRouter();

  const { data: doctor, isLoading, isError } = usePublicDoctorById(doctorId);
  const bookMutation = useBookConsultation();

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);

  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [consultationType, setConsultationType] = useState<ConsultationType>('Video');
  const [symptoms, setSymptoms] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!doctor) return;
    if (!scheduledDate || !startTime || !endTime || !symptoms.trim()) {
      toast.error('Please fill all required fields.');
      return;
    }

    try {
      await bookMutation.mutateAsync({
        doctorId: doctor.id,
        availabilityId: null,
        scheduledDate,
        startTime: normalizeToSeconds(startTime),
        endTime: normalizeToSeconds(endTime),
        timeZone: tz,
        consultationType,
        symptoms: symptoms.trim(),
        isFollowUp: false,
        parentConsultationId: null,
      });

      toast.success('Consultation booked successfully.');
      router.replace(ROUTES.patient.consultations);
    } catch (err) {
      toast.error(parseApiError(err).message ?? 'Failed to book consultation.');
    }
  };

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
        title="Doctor unavailable"
        message="This doctor cannot be booked right now."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book Consultation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {doctor.fullName} • {doctor.specialization ?? 'General Physician'}
          </p>
        </div>
        <Link
          href={ROUTES.patient.doctorProfile(doctor.id)}
          className="rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Back to Profile
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="scheduledDate" className="mb-1 block text-sm font-medium text-foreground">Date</label>
              <input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="consultationType" className="mb-1 block text-sm font-medium text-foreground">Consultation Type</label>
              <select
                id="consultationType"
                value={consultationType}
                onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="Video">Video</option>
                <option value="InPerson">In Person</option>
              </select>
            </div>
            <div>
              <label htmlFor="startTime" className="mb-1 block text-sm font-medium text-foreground">Start Time</label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="mb-1 block text-sm font-medium text-foreground">End Time</label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="symptoms" className="mb-1 block text-sm font-medium text-foreground">Symptoms / Reason</label>
            <textarea
              id="symptoms"
              rows={4}
              minLength={10}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Briefly describe your symptoms (minimum 10 characters)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={bookMutation.isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Booking Notes</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Times are submitted in your timezone: {tz}.</li>
              <li>Doctor must confirm your booking request.</li>
              <li>Avoid duplicate slots with the same doctor.</li>
            </ul>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Doctor Availability</h2>
            {doctor.availability.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No public slots shared.</p>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                {doctor.availability.map((slot, idx) => (
                  <p key={`${slot.dayOfWeek}-${slot.startTime}-${idx}`} className="text-muted-foreground">
                    {DAY_NAMES[slot.dayOfWeek] ?? `Day ${slot.dayOfWeek}`}: {slot.startTime} - {slot.endTime}
                  </p>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function PatientBookConsultationPage() {
  return (
    <PatientGuard>
      <BookConsultationContent />
    </PatientGuard>
  );
}
