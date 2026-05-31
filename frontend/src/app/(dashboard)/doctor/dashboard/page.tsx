'use client';

import { DoctorGuard } from '@/guards/doctor.guard';
import { useDoctorStatusGate, useDoctorConsultationRequests } from '@/modules/doctor/hooks/useDoctor';
import { Spinner } from '@/components/shared/spinner';
import { ROUTES } from '@/config/routes';
import Link from 'next/link';

// ── Design tokens (matches patient dashboard) ─────────────────────────────────
const C = {
  navy:    '#304F6D',
  sage:    '#899481',
  orange:  '#E07D54',
  gold:    '#FFE1A0',
  iceBg:   '#E2F3FD',
  surface: '#E6E1DD',
  text:    '#1F2937',
  muted:   '#6B7280',
  white:   '#FFFFFF',
} as const;

const GLASS: React.CSSProperties = {
  background:           'rgba(255,255,255,0.72)',
  backdropFilter:       'blur(18px) saturate(180%)',
  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
  border:               '1px solid rgba(255,255,255,0.45)',
  boxShadow:            '0 8px 32px rgba(48,79,109,0.09)',
  borderRadius:         20,
};

const T = 'all 0.25s cubic-bezier(0.4,0,0.2,1)';

const FONT: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
  letterSpacing: '-0.01em',
};

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: 'rgba(48,79,109,0.09)' }} />;
}

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
  // Strip any existing "Dr." / "Dr" prefix from fullName before prepending
  const rawName = profile?.fullName ?? '';
  const cleanName = rawName.replace(/^dr\.?\s+/i, '').trim();
  const initials = cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'DR';

  const stats = [
    {
      label: 'Pending Requests',
      value: pendingRequests,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
        </svg>
      ),
      iconBg: 'rgba(224,125,84,0.12)', iconColor: C.orange, valueColor: C.orange,
    },
    {
      label: 'Total Consultations',
      value: profile?.totalConsultations ?? 0,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
      iconBg: C.iceBg, iconColor: C.navy, valueColor: C.navy,
    },
    {
      label: 'Rating',
      value: profile?.rating != null ? profile.rating.toFixed(1) : '—',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
      ),
      iconBg: 'rgba(255,225,160,0.35)', iconColor: '#8a6a00', valueColor: '#8a6a00',
    },
    {
      label: 'Total Reviews',
      value: profile?.totalReviews ?? 0,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
      iconBg: 'rgba(137,148,129,0.15)', iconColor: C.sage, valueColor: C.sage,
    },
  ];

  const quickLinks = [
    {
      href: ROUTES.doctor.consultations,
      label: 'Consultation Requests',
      desc: 'Review and manage incoming requests',
      iconBg: C.iceBg,
      iconColor: C.navy,
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>,
      badge: pendingRequests > 0 ? pendingRequests : null,
    },
    {
      href: ROUTES.doctor.availability,
      label: 'Manage Availability',
      desc: 'Set your weekly schedule',
      iconBg: 'rgba(255,225,160,0.35)',
      iconColor: '#8a6a00',
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>,
      badge: null,
    },
    {
      href: ROUTES.doctor.profile,
      label: 'My Profile',
      desc: 'View and update your profile',
      iconBg: 'rgba(137,148,129,0.15)',
      iconColor: C.sage,
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>,
      badge: null,
    },
  ];

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10"
      style={{ background: C.surface, minHeight: '100%', ...FONT }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div
        className="mb-6 relative overflow-hidden"
        style={{
          background:   C.navy,
          borderRadius: 28,
          padding:      '32px 32px',
          boxShadow:    '0 12px 40px rgba(48,79,109,0.28)',
        }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 rounded-full opacity-[0.12]" style={{ width: 220, height: 220, background: C.white }} aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 rounded-full opacity-[0.08]" style={{ width: 160, height: 160, background: C.gold }} aria-hidden />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.30)', backdropFilter: 'blur(8px)' }}
            >
              {initials}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>Doctor Portal</p>
              <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
                Dr. {cleanName || 'Doctor'}
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {profile?.specialization ?? 'Medical Professional'}{profile?.hospitalName ? ` · ${profile.hospitalName}` : ''}
              </p>
            </div>
          </div>

          {/* Visibility badge + CTA */}
          <div className="flex flex-col gap-2 items-start sm:items-end">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={profile?.isPubliclyVisible
                ? { background: 'rgba(255,225,160,0.20)', color: C.gold }
                : { background: 'rgba(224,125,84,0.20)', color: '#ffa07a' }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: profile?.isPubliclyVisible ? C.gold : '#ffa07a' }} />
              {profile?.isPubliclyVisible ? 'Live to Patients' : 'Not Yet Visible'}
            </span>
            {!profile?.isPubliclyVisible && (
              <Link
                href={ROUTES.doctor.profileEdit}
                className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: C.orange, color: '#000000', boxShadow: '0 4px 14px rgba(224,125,84,0.40)' }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                Complete Profile
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-3 p-5"
            style={{ ...GLASS, transition: T }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.13)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.09)'; }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: s.iconBg, color: s.iconColor }}>
              {s.icon}
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums" style={{ color: s.valueColor, letterSpacing: '-0.04em' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: C.muted }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Links ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 p-5 group"
            style={{ ...GLASS, transition: T }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.14)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.09)'; }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: link.iconBg, color: link.iconColor }}>
              {link.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate" style={{ color: C.text }}>{link.label}</p>
                {link.badge !== null && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ background: C.orange }}>{link.badge}</span>
                )}
              </div>
              <p className="text-xs mt-0.5 truncate" style={{ color: C.muted }}>{link.desc}</p>
            </div>
            <svg className="h-4 w-4 flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: C.navy }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
          </Link>
        ))}
      </div>

      {/* ── Profile Summary ───────────────────────────────────────────── */}
      {profile && (
        <div style={{ ...GLASS, padding: 24 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ fontSize: 16, color: C.navy, letterSpacing: '-0.02em' }}>Profile Summary</h2>
            <Link
              href={ROUTES.doctor.profileEdit}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-90"
              style={{ background: C.orange, color: '#000000' }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
              Edit
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'City',       value: profile.city              ?? '—' },
              { label: 'Fee',        value: profile.consultationFee != null ? `₹${profile.consultationFee}` : '—' },
              { label: 'Experience', value: profile.experienceYears   != null ? `${profile.experienceYears} yrs` : '—' },
              { label: 'Hospital',   value: profile.hospitalName      ?? '—' },
              { label: 'Reviews',    value: String(profile.totalReviews) },
              { label: 'Status',     value: profile.isPubliclyVisible ? 'Visible' : 'Not visible', accent: profile.isPubliclyVisible },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3" style={{ background: 'rgba(48,79,109,0.04)', border: '1px solid rgba(48,79,109,0.07)' }}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>{item.label}</dt>
                <dd className="font-semibold mt-0.5 truncate" style={{ color: 'accent' in item ? (item.accent ? C.sage : C.orange) : C.text, fontSize: 13 }}>{item.value}</dd>
              </div>
            ))}
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

