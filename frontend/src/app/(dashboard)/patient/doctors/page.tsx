'use client';

/**
 * Patient — Find Doctors
 * Route: /patient/doctors
 * Guard: PatientGuard
 *
 * Source of truth:
 *  - backend/Modules/Doctor/SDD/APIs.md #1 GET /api/doctors (public, no auth)
 *  - frontend/SDD/patient.md §5.2 Find Doctors Screen
 *
 * Calls GET /api/doctors with optional search/filter params.
 * Backend returns only approved + publicly visible doctors.
 */

import { useState, useDeferredValue } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PatientGuard } from '@/guards/patient.guard';
import { usePublicDoctorList } from '@/modules/doctor/hooks/useDoctor';
import type { DoctorPublicListItem } from '@/modules/doctor/types/doctor.types';
import { EmptyState } from '@/components/shared/empty-state';
import { ROUTES } from '@/config/routes';

// ─── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor }: { doctor: DoctorPublicListItem }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
          {doctor.profileImageUrl ? (
            <Image
              src={doctor.profileImageUrl}
              alt={doctor.fullName}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
              {doctor.fullName.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{doctor.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">{doctor.specialization ?? 'General'}</p>
        </div>
      </div>

      {/* Metadata row */}
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span>{doctor.experienceYears != null ? `${doctor.experienceYears} yrs exp` : '—'}</span>
        <span className="text-right">{doctor.city ?? '—'}</span>
        <span>{doctor.rating != null ? `⭐ ${doctor.rating.toFixed(1)} (${doctor.totalReviews})` : 'No reviews yet'}</span>
        <span className="text-right font-medium text-foreground">
          {doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '—'}
        </span>
      </div>

      {/* Languages */}
      {doctor.languagesSpoken.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doctor.languagesSpoken.slice(0, 3).map((lang) => (
            <span key={lang} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {lang}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <Link
        href={`${ROUTES.patient.doctors}/${doctor.id}`}
        className="mt-auto flex h-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        View Profile
      </Link>
    </div>
  );
}

function DoctorCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-8 animate-pulse rounded bg-muted" />
      <div className="h-9 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function FindDoctorsContent() {
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const deferredSearch = useDeferredValue(search);

  const params: Record<string, unknown> = {};
  if (deferredSearch) params.search = deferredSearch;
  if (specialization) params.specialization = specialization;

  const { data, isLoading, isError } = usePublicDoctorList(Object.keys(params).length ? params : undefined);
  const doctors: DoctorPublicListItem[] = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find a Doctor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse verified, approved doctors and book a consultation.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search by name, specialization, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="h-10 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All specializations</option>
          {['Cardiologist', 'Dermatologist', 'Paediatrician', 'General Physician', 'Neurologist', 'Gynaecologist', 'Psychiatrist', 'Orthopaedic'].map(
            (s) => <option key={s} value={s}>{s}</option>
          )}
        </select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <DoctorCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <EmptyState title="Failed to load doctors" message="Check your connection and try again." />
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          message={deferredSearch || specialization ? 'Try adjusting your search filters.' : 'No approved doctors are available right now.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
        </div>
      )}
    </div>
  );
}

export default function FindDoctorsPage() {
  return (
    <PatientGuard>
      <FindDoctorsContent />
    </PatientGuard>
  );
}

