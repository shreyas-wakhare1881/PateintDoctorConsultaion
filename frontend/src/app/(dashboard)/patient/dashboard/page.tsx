'use client';

/**
 * Patient Dashboard
 * Route: /patient/dashboard
 * Guard: PatientGuard
 *
 * Energy Palette — Premium Healthcare SaaS
 * Navy #304F6D · Sage #899481 · Orange #E07D54 · Gold #FFE1A0
 * Ice Blue #E2F3FD · Neutral Surface #E6E1DD
 *
 * Font: Inter — premium enterprise SaaS typography
 * Layout: Hero → Stats (4) → Appointment + Doctors → Prescriptions + Timeline
 * Real data only. No dummy content. All hooks/routes/APIs unchanged.
 */

import Link from 'next/link';
import { PatientGuard } from '@/guards/patient.guard';
import { usePatientProfile } from '@/modules/patient/hooks/usePatient';
import { useMyConsultations } from '@/modules/consultation/hooks/useConsultation';
import { useMyPrescriptions } from '@/modules/prescription/hooks/usePrescription';
import type { ConsultationSummaryDto } from '@/modules/consultation/types/consultation.types';
import { ROUTES } from '@/config/routes';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';

// ── Energy Design Tokens ──────────────────────────────────────────────────────
const C = {
  navyPrimary:    '#304F6D',
  sagePrimary:    '#899481',
  orangeAccent:   '#E07D54',
  goldAccent:     '#FFE1A0',
  infoBlue:       '#E2F3FD',
  neutralSurface: '#E6E1DD',
  textPrimary:    '#1F2937',
  textSecondary:  '#6B7280',
  white:          '#FFFFFF',
  error:          '#EF4444',
} as const;

const GLASS_CARD: React.CSSProperties = {
  background:           'rgba(255,255,255,0.70)',
  backdropFilter:       'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border:               '1px solid rgba(255,255,255,0.20)',
  boxShadow:            '0 8px 32px rgba(48,79,109,0.08)',
  borderRadius:         24,
};

const T = 'all 0.3s cubic-bezier(0.4,0,0.2,1)';

const FONT: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, 'Inter var', system-ui, -apple-system, sans-serif",
  letterSpacing: '-0.01em',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ w, h, radius = 8 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div
      className="animate-pulse flex-shrink-0"
      style={{ width: w, height: h, borderRadius: radius, background: 'rgba(48,79,109,0.09)' }}
    />
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, iconBg, iconColor, isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-3 p-5"
      style={{ ...GLASS_CARD, ...FONT, transition: T, cursor: 'default' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.14)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.08)';
      }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-2xl flex-shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton w="55%" h={30} radius={6} />
          <Skeleton w="80%" h={14} radius={4} />
        </div>
      ) : (
        <>
          <p className="leading-none font-bold" style={{ fontSize: 30, color: C.navyPrimary, letterSpacing: '-0.03em' }}>
            {value}
          </p>
          <p className="text-sm font-medium" style={{ color: C.textSecondary }}>
            {label}
          </p>
        </>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function PatientDashboardContent() {
  const { data: profile, isLoading: profileLoading } = usePatientProfile();
  const { data: consultations, isLoading: consultationsLoading } = useMyConsultations({ page: 1, pageSize: 20 });
  const { data: prescriptions, isLoading: prescriptionsLoading } = useMyPrescriptions();

  const fullName  = profile?.fullName ?? '';
  const firstName = fullName.split(' ')[0] || 'Hi Welcome';

  const nextConsultation: ConsultationSummaryDto | null =
    consultations?.items?.find(
      (c: ConsultationSummaryDto) =>
        c.status === 'Confirmed' || c.status === 'Pending' || c.status === 'InProgress'
    ) ?? null;

  const myDoctors: { id: string; name: string; specialization: string }[] = consultations?.items
    ? Array.from(
        new Map(
          consultations.items.map((c: ConsultationSummaryDto) => [
            c.doctorId,
            { id: c.doctorId, name: c.doctorName, specialization: c.doctorSpecialization ?? 'General Physician' },
          ])
        ).values()
      ).slice(0, 4)
    : [];

  const upcomingCount = consultations?.items?.filter(
    (c: ConsultationSummaryDto) => c.status === 'Confirmed' || c.status === 'Pending' || c.status === 'InProgress'
  )?.length ?? 0;

  const prescriptionCount  = prescriptions?.length ?? 0;
  const doctorCount        = myDoctors.length;
  const totalConsultations =
    (consultations as { total?: number } | undefined)?.total ?? consultations?.items?.length ?? 0;

  const recentActivity      = consultations?.items?.slice(0, 5) ?? [];
  const recentPrescriptions = prescriptions?.slice(0, 3) ?? [];

  const isHeaderLoading = profileLoading || consultationsLoading;

  const statusColor = (s: string) => {
    switch (s) {
      case 'Completed':  return C.sagePrimary;
      case 'Confirmed':  return C.navyPrimary;
      case 'InProgress': return C.orangeAccent;
      case 'Cancelled':  return C.error;
      default:           return C.textSecondary;
    }
  };
  const statusBg = (s: string) => {
    switch (s) {
      case 'Completed':  return 'rgba(137,148,129,0.15)';
      case 'Confirmed':  return 'rgba(48,79,109,0.12)';
      case 'InProgress': return 'rgba(224,125,84,0.15)';
      case 'Cancelled':  return 'rgba(239,68,68,0.12)';
      default:           return 'rgba(107,114,128,0.12)';
    }
  };

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10"
      style={{ background: C.neutralSurface, minHeight: '100%', ...FONT }}
    >

      {/* ════════════════════ ROW 1 — HERO ════════════════════════════════ */}
      <div
        className="mb-6 overflow-hidden relative"
        style={{
          background:   'linear-gradient(135deg, #304F6D 0%, #899481 100%)',
          borderRadius: 32,
          padding:      '36px 36px',
          boxShadow:    '0 12px 40px rgba(48,79,109,0.30)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 rounded-full opacity-[0.15]"
          style={{ width: 260, height: 260, background: C.white }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/4 rounded-full opacity-10"
          style={{ width: 180, height: 180, background: C.white }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-6 right-1/3 rounded-full opacity-[0.08]"
          style={{ width: 100, height: 100, background: C.goldAccent }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Greeting */}
          <div>
            <p className="text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 11 }}>
              Patient Portal
            </p>
            {isHeaderLoading ? (
              <div className="flex flex-col gap-2.5">
                <Skeleton w={260} h={40} radius={10} />
                <Skeleton w={200} h={16} radius={5} />
              </div>
            ) : (
              <>
                <h1
                  className="font-bold leading-none"
                  style={{ fontSize: 34, color: C.white, letterSpacing: '-0.03em' }}
                >
                  {fullName || firstName}
                  <svg className="inline-block ml-2 h-8 w-8 align-middle" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 4 }}>
                    <path d="M24 8C24 8 26 10 24 14C22 18 18 18 18 22C18 24.5 20 26 20 26" stroke="#FFE1A0" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 24C8 24 6 22 8 18C10 14 14 14 14 10C14 7.5 12 6 12 6" stroke="#FFE1A0" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="22" cy="6" r="2" fill="#FFE1A0"/>
                    <circle cx="10" cy="26" r="2" fill="#FFE1A0"/>
                  </svg>
                </h1>
                <p className="mt-2.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.72)', letterSpacing: '-0.005em' }}>
                  Here&apos;s your health summary for today.
                </p>
              </>
            )}

            {/* Inline stats pills */}
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.16)' }}
              >
                <svg className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.goldAccent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <span className="text-xs font-bold text-white">{upcomingCount}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>Upcoming</span>
              </div>
              <div
                className="flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.16)' }}
              >
                <svg className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.goldAccent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="text-xs font-bold text-white">{prescriptionCount}</span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>Prescriptions</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
            <Link
              href={ROUTES.patient.doctors}
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
              style={{
                background:           'rgba(255,255,255,0.14)',
                backdropFilter:       'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border:               '1px solid rgba(255,255,255,0.24)',
                transition:           T,
                letterSpacing:        '-0.01em',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.24)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; }}
              aria-label="Book an appointment"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              Book Appointment
            </Link>
            <Link
              href={ROUTES.patient.doctors}
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
              style={{
                background:    C.orangeAccent,
                color:         C.white,
                border:        '1px solid rgba(255,255,255,0.20)',
                transition:    T,
                letterSpacing: '-0.01em',
                boxShadow:     '0 4px 16px rgba(224,125,84,0.40)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#d06843';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(224,125,84,0.50)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = C.orangeAccent;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(224,125,84,0.40)';
              }}
              aria-label="Find a doctor"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              Find Doctor
            </Link>
          </div>
        </div>
      </div>

      {/* ════════════════════ ROW 2 — STATS ════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <StatCard
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>}
          label="Upcoming Consultations"
          value={upcomingCount}
          iconBg={C.infoBlue}
          iconColor={C.navyPrimary}
          isLoading={consultationsLoading}
        />
        <StatCard
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>}
          label="Active Prescriptions"
          value={prescriptionCount}
          iconBg="rgba(255,225,160,0.35)"
          iconColor="#8a6a00"
          isLoading={prescriptionsLoading}
        />
        <StatCard
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}
          label="Connected Doctors"
          value={doctorCount}
          iconBg="rgba(137,148,129,0.15)"
          iconColor={C.sagePrimary}
          isLoading={consultationsLoading}
        />
        <StatCard
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>}
          label="Total Consultations"
          value={totalConsultations}
          iconBg="rgba(224,125,84,0.12)"
          iconColor={C.orangeAccent}
          isLoading={consultationsLoading}
        />
      </div>

      {/* ════════════════════ ROW 3 — APPOINTMENT + DOCTORS ════════════════ */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">

        {/* ── Upcoming Appointment ──────────────────────────────────────── */}
        <div
          style={{ ...GLASS_CARD, padding: 24, transition: T }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.14)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.08)';
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ fontSize: 18, color: C.navyPrimary, letterSpacing: '-0.02em' }}>
              Upcoming Appointment
            </h2>
            <Link
              href={ROUTES.patient.consultations}
              className="text-xs font-semibold"
              style={{ color: C.sagePrimary, transition: T, letterSpacing: '-0.01em' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.navyPrimary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.sagePrimary; }}
            >
              View all →
            </Link>
          </div>

          {consultationsLoading ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: C.infoBlue }}>
                <Skeleton w={56} h={56} radius={16} />
                <div className="flex-1 flex flex-col gap-2.5">
                  <Skeleton w="60%" h={16} />
                  <Skeleton w="40%" h={12} />
                  <Skeleton w="50%" h={12} />
                </div>
              </div>
              <Skeleton w="100%" h={44} radius={14} />
            </div>
          ) : nextConsultation ? (
            <div>
              <div
                className="flex items-center gap-4 p-4 mb-4 rounded-2xl"
                style={{ background: C.infoBlue, border: '1px solid rgba(48,79,109,0.10)' }}
              >
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl font-bold text-lg text-white"
                  style={{ background: '#304F6D' }}
                  aria-hidden="true"
                >
                  {nextConsultation.doctorName?.charAt(0) ?? 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate" style={{ color: C.navyPrimary, letterSpacing: '-0.02em' }}>
                    {nextConsultation.doctorName ?? 'Your Doctor'}
                  </p>
                  <p className="text-sm truncate mt-0.5" style={{ color: C.textSecondary }}>
                    {nextConsultation.doctorSpecialization ?? 'Specialist'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" style={{ color: C.sagePrimary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-xs font-medium" style={{ color: C.textSecondary }}>
                      {nextConsultation.scheduledDate} · {nextConsultation.startTime}
                    </span>
                  </div>
                </div>
                <div
                  className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: statusBg(nextConsultation.status), color: statusColor(nextConsultation.status) }}
                >
                  {nextConsultation.status}
                </div>
              </div>

              <div className="flex gap-3">
                {nextConsultation.consultationType === 'Video' && (
                  <Link
                    href={ROUTES.patient.consultationDetail(nextConsultation.id)}
                    className="flex flex-1 h-11 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white"
                    style={{
                      background: 'linear-gradient(135deg, #304F6D, #899481)',
                      transition: T,
                      letterSpacing: '-0.01em',
                      boxShadow: '0 4px 16px rgba(48,79,109,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(48,79,109,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(48,79,109,0.25)';
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    Join Video Call
                  </Link>
                )}
                <Link
                  href={ROUTES.patient.consultationDetail((nextConsultation as { id: string }).id)}
                  className="flex flex-1 h-11 items-center justify-center gap-2 rounded-2xl border text-sm font-medium"
                  style={{
                    color:       C.navyPrimary,
                    borderColor: 'rgba(48,79,109,0.18)',
                    background:  'rgba(48,79,109,0.05)',
                    transition:  T,
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(48,79,109,0.10)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(48,79,109,0.28)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(48,79,109,0.05)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(48,79,109,0.18)';
                  }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  View Details
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-2xl"
              style={{ background: C.infoBlue, border: '1px dashed rgba(48,79,109,0.18)' }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                style={{ background: 'rgba(48,79,109,0.10)' }}
              >
                <svg className="h-7 w-7" style={{ color: C.navyPrimary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1.5" style={{ color: C.navyPrimary, letterSpacing: '-0.01em' }}>
                No upcoming appointments
              </p>
              <p className="text-xs mb-5 text-center px-4" style={{ color: C.textSecondary }}>
                Book a consultation with a specialist today
              </p>
              <Link
                href={ROUTES.patient.doctors}
                className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white"
                style={{
                  background: C.orangeAccent,
                  transition: T,
                  letterSpacing: '-0.01em',
                  boxShadow: '0 4px 16px rgba(224,125,84,0.40)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.background = '#d06843';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.background = C.orangeAccent;
                }}
              >
                Book Now
              </Link>
            </div>
          )}
        </div>

        {/* ── My Doctors ────────────────────────────────────────────────── */}
        <div
          style={{ ...GLASS_CARD, padding: 24, transition: T }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.14)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.08)';
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ fontSize: 18, color: C.navyPrimary, letterSpacing: '-0.02em' }}>
              My Doctors
            </h2>
            <Link
              href={ROUTES.patient.doctors}
              className="text-xs font-semibold"
              style={{ color: C.sagePrimary, transition: T, letterSpacing: '-0.01em' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.navyPrimary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.sagePrimary; }}
            >
              Find more →
            </Link>
          </div>

          {consultationsLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(48,79,109,0.04)' }}>
                  <Skeleton w={48} h={48} radius={14} />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton w="55%" h={14} />
                    <Skeleton w="40%" h={11} />
                  </div>
                </div>
              ))}
            </div>
          ) : myDoctors.length > 0 ? (
            <div className="flex flex-col gap-3">
              {myDoctors.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{
                    background: idx === 0 ? C.infoBlue : 'rgba(48,79,109,0.04)',
                    border:     `1px solid ${idx === 0 ? 'rgba(48,79,109,0.12)' : 'rgba(48,79,109,0.06)'}`,
                    transition: T,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(48,79,109,0.08)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(48,79,109,0.16)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = idx === 0 ? C.infoBlue : 'rgba(48,79,109,0.04)';
                    (e.currentTarget as HTMLElement).style.borderColor = idx === 0 ? 'rgba(48,79,109,0.12)' : 'rgba(48,79,109,0.06)';
                  }}
                >
                  <DoctorAvatar
                    seed={doc.id}
                    name={doc.name}
                    size={48}
                    className="rounded-2xl flex-shrink-0"
                    style={{ borderRadius: 14 }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.navyPrimary, letterSpacing: '-0.01em' }}>
                      {doc.name}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: C.textSecondary }}>
                      {idx === 0 ? 'Primary Consultant · ' : ''}{doc.specialization}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Link
                      href={ROUTES.patient.doctors}
                      className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(48,79,109,0.08)', color: C.navyPrimary, transition: T }}
                      aria-label={`View ${doc.name}'s profile`}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = C.navyPrimary;
                        (e.currentTarget as HTMLElement).style.color = C.white;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(48,79,109,0.08)';
                        (e.currentTarget as HTMLElement).style.color = C.navyPrimary;
                      }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </Link>
                    <Link
                      href={ROUTES.patient.consultations}
                      className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ background: 'rgba(137,148,129,0.12)', color: C.sagePrimary, transition: T }}
                      aria-label={`Message ${doc.name}`}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = C.sagePrimary;
                        (e.currentTarget as HTMLElement).style.color = C.white;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(137,148,129,0.12)';
                        (e.currentTarget as HTMLElement).style.color = C.sagePrimary;
                      }}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-2xl"
              style={{ background: C.infoBlue, border: '1px dashed rgba(48,79,109,0.18)' }}
            >
              <p className="text-sm font-semibold mb-1.5" style={{ color: C.navyPrimary, letterSpacing: '-0.01em' }}>
                No consultation history yet
              </p>
              <p className="text-xs mb-4" style={{ color: C.textSecondary }}>
                Connect with a specialist today
              </p>
              <Link
                href={ROUTES.patient.doctors}
                className="text-sm font-semibold"
                style={{ color: C.orangeAccent, transition: T }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#d06843'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.orangeAccent; }}
              >
                Find a Doctor →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════ ROW 4 — PRESCRIPTIONS + TIMELINE ════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ── Prescription Summary ──────────────────────────────────────── */}
        <div
          style={{ ...GLASS_CARD, padding: 24, transition: T }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.14)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.08)';
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ fontSize: 18, color: C.navyPrimary, letterSpacing: '-0.02em' }}>
              Prescription Summary
            </h2>
            <Link
              href={ROUTES.patient.prescriptions}
              className="text-xs font-semibold"
              style={{ color: C.sagePrimary, transition: T, letterSpacing: '-0.01em' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.navyPrimary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.sagePrimary; }}
            >
              View all →
            </Link>
          </div>

          {prescriptionsLoading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(48,79,109,0.04)' }}>
                  <Skeleton w={40} h={40} radius={12} />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton w="50%" h={14} />
                    <Skeleton w="70%" h={11} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentPrescriptions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentPrescriptions.map((rx, idx) => (
                <div
                  key={rx.id}
                  className="flex items-start gap-3 p-3.5 rounded-2xl"
                  style={{
                    background: idx === 0 ? 'rgba(255,225,160,0.25)' : 'rgba(48,79,109,0.03)',
                    border:     `1px solid ${idx === 0 ? 'rgba(255,225,160,0.60)' : 'rgba(48,79,109,0.07)'}`,
                    transition: T,
                  }}
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: idx === 0 ? 'rgba(255,225,160,0.50)' : 'rgba(48,79,109,0.08)',
                      color:      idx === 0 ? '#8a6a00' : C.navyPrimary,
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: C.navyPrimary, letterSpacing: '-0.01em' }}>
                      {rx.diagnosis ?? 'General Prescription'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>
                      {rx.items.length} medication{rx.items.length !== 1 ? 's' : ''} ·{' '}
                      {new Date(rx.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {rx.items.length > 0 && (
                      <p className="text-xs mt-1 truncate font-medium" style={{ color: C.sagePrimary }}>
                        {rx.items.slice(0, 2).map((item) => item.medicineName).join(', ')}
                        {rx.items.length > 2 ? ` +${rx.items.length - 2} more` : ''}
                      </p>
                    )}
                  </div>
                  {idx === 0 && (
                    <div
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: 'rgba(255,225,160,0.70)', color: '#6b4e00' }}
                    >
                      Latest
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-2xl"
              style={{ background: C.infoBlue, border: '1px dashed rgba(48,79,109,0.18)' }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                style={{ background: 'rgba(48,79,109,0.10)' }}
              >
                <svg className="h-7 w-7" style={{ color: C.navyPrimary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1.5" style={{ color: C.navyPrimary, letterSpacing: '-0.01em' }}>
                No prescriptions yet
              </p>
              <p className="text-xs" style={{ color: C.textSecondary }}>
                Prescriptions appear after consultations
              </p>
            </div>
          )}
        </div>

        {/* ── Activity Timeline ─────────────────────────────────────────── */}
        <div
          style={{ ...GLASS_CARD, padding: 24, transition: T }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(48,79,109,0.14)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(48,79,109,0.08)';
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ fontSize: 18, color: C.navyPrimary, letterSpacing: '-0.02em' }}>
              Activity Timeline
            </h2>
            <Link
              href={ROUTES.patient.consultations}
              className="text-xs font-semibold"
              style={{ color: C.sagePrimary, transition: T, letterSpacing: '-0.01em' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = C.navyPrimary; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = C.sagePrimary; }}
            >
              View all →
            </Link>
          </div>

          {consultationsLoading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton w={36} h={36} radius={10} />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton w="60%" h={14} />
                    <Skeleton w="45%" h={11} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-[17px] top-0 bottom-0 w-px pointer-events-none"
                style={{ background: 'rgba(48,79,109,0.10)' }}
                aria-hidden="true"
              />
              <div className="flex flex-col gap-4">
                {recentActivity.map((c: ConsultationSummaryDto) => (
                  <div key={c.id} className="flex items-start gap-3 relative pl-9">
                    <div
                      className="absolute left-0 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl z-10"
                      style={{ background: statusBg(c.status), color: statusColor(c.status) }}
                      aria-hidden="true"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate" style={{ color: C.navyPrimary, letterSpacing: '-0.01em' }}>
                          {c.doctorName ?? 'Doctor'}
                        </p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0"
                          style={{ background: statusBg(c.status), color: statusColor(c.status) }}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: C.textSecondary }}>
                        {c.doctorSpecialization ?? 'General Physician'} · {c.consultationType}
                      </p>
                      <p className="text-xs mt-0.5 font-medium" style={{ color: C.sagePrimary }}>
                        {c.scheduledDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-2xl"
              style={{ background: C.infoBlue, border: '1px dashed rgba(48,79,109,0.18)' }}
            >
              <p className="text-sm font-semibold mb-1.5" style={{ color: C.navyPrimary, letterSpacing: '-0.01em' }}>
                No activity yet
              </p>
              <p className="text-xs" style={{ color: C.textSecondary }}>
                Your consultation history will appear here
              </p>
            </div>
          )}
        </div>
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