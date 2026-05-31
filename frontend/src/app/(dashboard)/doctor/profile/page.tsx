'use client';

/**
 * Doctor Profile Page
 * Route: /doctor/profile
 * Guard: DoctorGuard
 *
 * Displays the authenticated doctor's profile with key details
 * and links to the profile edit page for updates.
 */

import Link from 'next/link';
import { DoctorGuard } from '@/guards/doctor.guard';
import { Spinner } from '@/components/shared/spinner';
import { useDoctorProfile } from '@/modules/doctor/hooks/useDoctor';
import { ROUTES } from '@/config/routes';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DoctorProfileContent() {
  const { data: profile, isLoading } = useDoctorProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">Failed to load profile. Please refresh.</p>
      </div>
    );
  }

  const initials = profile.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  const statusStyle: Record<string, React.CSSProperties> = {
    Approved:  { background: 'rgba(137,148,129,0.15)', color: '#899481' },
    Pending:   { background: 'rgba(224,125,84,0.12)',  color: '#E07D54' },
    Rejected:  { background: 'rgba(239,68,68,0.10)',   color: '#EF4444' },
    Suspended: { background: 'rgba(224,125,84,0.12)',  color: '#d06843' },
  };

  const GLASS: React.CSSProperties = {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(18px) saturate(180%)',
    WebkitBackdropFilter: 'blur(18px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.45)',
    boxShadow: '0 8px 32px rgba(48,79,109,0.09)',
    borderRadius: 20,
  };

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", letterSpacing: '-0.01em' }}
    >
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.03em' }}>My Profile</h1>
            <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Your professional profile visible to patients.</p>
          </div>
          <Link
            href={ROUTES.doctor.profileEdit}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: '#E07D54', color: '#000000', boxShadow: '0 4px 12px rgba(224,125,84,0.30)' }}
          >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
            Edit Profile
          </Link>
        </div>

        {/* Avatar + identity card */}
        <div style={{ ...GLASS, padding: 24 }} className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: '#304F6D' }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold" style={{ color: '#1F2937', letterSpacing: '-0.02em' }}>{profile.fullName}</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>{profile.specialization ?? 'Specialization not set'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={statusStyle[profile.approvalStatus] ?? { background: 'rgba(107,114,128,0.10)', color: '#6B7280' }}
              >
                {profile.approvalStatus}
              </span>
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={profile.isPubliclyVisible
                  ? { background: 'rgba(137,148,129,0.15)', color: '#596550' }
                  : { background: 'rgba(107,114,128,0.08)', color: '#6B7280' }
                }
              >
                {profile.isPubliclyVisible ? 'Publicly visible' : 'Not visible'}
              </span>
            </div>
          </div>
        </div>

        {/* Professional details */}
        <div style={{ ...GLASS, padding: 24 }}>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: '#899481' }}>Professional Details</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
            { label: 'Qualification', value: profile.qualification },
            { label: 'License Number', value: profile.licenseNumber },
            { label: 'Experience', value: profile.experienceYears != null ? `${profile.experienceYears} years` : null },
            { label: 'Consultation Fee', value: profile.consultationFee != null ? `₹${profile.consultationFee}` : null },
            { label: 'Hospital', value: profile.hospitalName },
            { label: 'Clinic Address', value: profile.clinicAddress },
            { label: 'City', value: profile.city },
            { label: 'State', value: profile.state },
            { label: 'Country', value: profile.country },
            { label: 'Languages', value: profile.languagesSpoken.length > 0 ? profile.languagesSpoken.join(', ') : null },
            { label: 'Rating', value: profile.rating != null ? `${profile.rating.toFixed(1)} / 5 (${profile.totalReviews} reviews)` : null },
            { label: 'Total Consultations', value: profile.totalConsultations.toString() },
          ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(48,79,109,0.04)', border: '1px solid rgba(48,79,109,0.07)' }}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold" style={{ color: '#1F2937' }}>{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ ...GLASS, padding: 24 }}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#899481' }}>Bio</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{profile.bio}</p>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              href: ROUTES.doctor.consultations,
              label: 'Consultations',
              desc: 'Manage requests and schedule',
              iconBg: '#E2F3FD', iconColor: '#304F6D',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>,
            },
            {
              href: ROUTES.doctor.availability,
              label: 'Availability',
              desc: 'Manage your weekly schedule',
              iconBg: 'rgba(137,148,129,0.15)', iconColor: '#596550',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>,
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 group"
              style={{ ...GLASS, padding: 20, transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.14)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.09)'; }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: item.iconBg, color: item.iconColor }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: '#1F2937' }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{item.desc}</p>
              </div>
              <svg className="h-4 w-4 flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: '#304F6D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DoctorProfilePage() {
  return (
    <DoctorGuard>
      <DoctorProfileContent />
    </DoctorGuard>
  );
}

