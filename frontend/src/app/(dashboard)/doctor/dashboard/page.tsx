'use client';

/**
 * Doctor Dashboard
 * Route: /doctor/dashboard
 * Guard: DoctorGuard + useDoctorStatusGate
 *
 * Source of truth:
 *  - backend/Modules/Doctor/SDD/Flow.md §2 Login Flow
 *  - frontend/SDD/doctor.md §6.6 Doctor Dashboard
 *
 * useDoctorStatusGate automatically redirects non-Approved doctors to:
 *  - /doctor/setup   (isProfileCompleted = false)
 *  - /doctor/pending (ApprovalStatus = Pending)
 *  - /doctor/rejected (ApprovalStatus = Rejected)
 *  - /doctor/suspended (ApprovalStatus = Suspended)
 */

import { DoctorGuard } from '@/guards/doctor.guard';
import { useDoctorStatusGate, useDoctorConsultationRequests } from '@/modules/doctor/hooks/useDoctor';
import { Spinner } from '@/components/shared/spinner';
import { ROUTES } from '@/config/routes';
import Link from 'next/link';

function DoctorDashboardContent() {
  const { profile, isLoading, isApproved } = useDoctorStatusGate();
  const { data: requests } = useDoctorConsultationRequests();

  if (isLoading || !isApproved) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const pendingRequests = requests?.totalCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {profile?.fullName ?? 'Doctor'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.specialization ?? 'Your professional dashboard'}
        </p>
      </div>

      {/* Profile visibility banner */}
      {profile && !profile.isPubliclyVisible && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-4">
          <p className="text-sm font-medium text-amber-800">
            Your profile is not yet publicly visible to patients. Complete your profile to go live.
          </p>
          <Link
            href={ROUTES.doctor.profileEdit}
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 underline-offset-2 hover:underline"
          >
            Complete Profile →
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending Requests</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-amber-600">{pendingRequests}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Consultations</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{profile?.totalConsultations ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Rating</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {profile?.rating != null ? profile.rating.toFixed(1) : '—'}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href={ROUTES.doctor.consultations}
          className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Consultation Requests</p>
            <p className="text-xs text-muted-foreground">Review and manage incoming requests</p>
          </div>
        </Link>

        <Link
          href={ROUTES.doctor.availability}
          className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Manage Availability</p>
            <p className="text-xs text-muted-foreground">Set your weekly schedule</p>
          </div>
        </Link>

        <Link
          href={ROUTES.doctor.profile}
          className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">My Profile</p>
            <p className="text-xs text-muted-foreground">View and update your profile</p>
          </div>
        </Link>
      </div>

      {/* Profile details */}
      {profile && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-foreground">Profile Summary</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div><dt className="text-muted-foreground">City</dt><dd className="font-medium">{profile.city ?? '—'}</dd></div>
            <div><dt className="text-muted-foreground">Fee</dt><dd className="font-medium">{profile.consultationFee != null ? `₹${profile.consultationFee}` : '—'}</dd></div>
            <div><dt className="text-muted-foreground">Experience</dt><dd className="font-medium">{profile.experienceYears != null ? `${profile.experienceYears} yrs` : '—'}</dd></div>
            <div><dt className="text-muted-foreground">Hospital</dt><dd className="font-medium truncate">{profile.hospitalName ?? '—'}</dd></div>
            <div><dt className="text-muted-foreground">Reviews</dt><dd className="font-medium">{profile.totalReviews}</dd></div>
            <div>
              <dt className="text-muted-foreground">Visibility</dt>
              <dd className={`font-medium ${profile.isPubliclyVisible ? 'text-emerald-600' : 'text-amber-600'}`}>
                {profile.isPubliclyVisible ? 'Visible to Patients' : 'Not yet visible'}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

export default function DoctorDashboardPage() {
  return (
    <DoctorGuard>
      <DoctorDashboardContent />
    </DoctorGuard>
  );
}

