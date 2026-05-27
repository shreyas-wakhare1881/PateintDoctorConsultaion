'use client';

/**
 * Patient Dashboard
 * Route: /patient/dashboard
 * Guard: PatientGuard
 *
 * Source of truth: frontend/SDD/patient.md §5.1 Patient Dashboard
 *
 * Shows greeting, quick action cards, and recent consultations count.
 */

import Link from 'next/link';
import { PatientGuard } from '@/guards/patient.guard';
import { usePatientProfile, usePatientConsultations } from '@/modules/patient/hooks/usePatient';
import { ROUTES } from '@/config/routes';

function PatientDashboardContent() {
  const { data: profile, isLoading: profileLoading } = usePatientProfile();
  const { data: consultations } = usePatientConsultations();

  const consultationCount = consultations?.totalCount ?? 0;
  const firstName = profile?.fullName?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {profileLoading ? (
            <span className="inline-block h-7 w-48 animate-pulse rounded bg-muted" />
          ) : (
            `Welcome, ${firstName}`
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your health consultations in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Consultations</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{consultationCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">City</p>
          <p className="mt-1 text-xl font-bold">{profile?.city ?? '—'}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-sm text-muted-foreground">Blood Group</p>
          <p className="mt-1 text-xl font-bold">{profile?.bloodGroup ?? '—'}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href={ROUTES.patient.doctors}
          className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Find a Doctor</p>
            <p className="text-xs text-muted-foreground">Browse and book consultations</p>
          </div>
        </Link>

        <Link
          href={ROUTES.patient.consultations}
          className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">My Consultations</p>
            <p className="text-xs text-muted-foreground">View history and upcoming sessions</p>
          </div>
        </Link>

        <Link
          href={ROUTES.patient.profile}
          className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">My Profile</p>
            <p className="text-xs text-muted-foreground">Update personal & medical info</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function PatientDashboardPage() {
  return (
    <PatientGuard>
      <PatientDashboardContent />
    </PatientGuard>
  );
}

