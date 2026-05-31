'use client';

/**
 * TopNavbar — Horizontal top navigation bar for all dashboard roles.
 *
 * Layout: [Logo] [Apple Liquid-Glass Nav Capsule] [Search] [Bell] [Avatar]
 *
 * Nav capsule: single frosted-glass pill containing all role-specific nav
 * buttons. Active pill = opaque white chip inside the capsule.
 * Logo / Search / Bell / Profile carry NO individual background.
 *
 * Roles: Patient | Doctor | Admin
 * Mobile: pills hidden, MobileBottomNav handles navigation.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { useAuth } from '@/hooks/use-auth';
import { ROUTES } from '@/config/routes';
import { useState } from 'react';

interface NavPill {
  label: string;
  href: string;
}

const PATIENT_NAV: NavPill[] = [
  { label: 'Dashboard', href: ROUTES.patient.dashboard },
  { label: 'Find Doctor', href: ROUTES.patient.doctors },
  { label: 'Consultations', href: ROUTES.patient.consultations },
  { label: 'Prescriptions', href: ROUTES.patient.prescriptions },
  { label: 'Profile', href: ROUTES.patient.profile },
];

const DOCTOR_NAV: NavPill[] = [
  { label: 'Dashboard', href: ROUTES.doctor.dashboard },
  { label: 'Consultations', href: ROUTES.doctor.consultations },
  { label: 'Availability', href: ROUTES.doctor.availability },
  { label: 'Profile', href: ROUTES.doctor.profile },
];

const ADMIN_NAV: NavPill[] = [
  { label: 'Dashboard', href: ROUTES.admin.dashboard },
  { label: 'Doctors', href: ROUTES.admin.doctors },
  { label: 'Patients', href: ROUTES.admin.patients },
  { label: 'Consultations', href: ROUTES.admin.consultations },
  { label: 'Audit Logs', href: ROUTES.admin.auditLogs },
];

const NAV_BY_ROLE: Record<string, NavPill[]> = {
  Patient: PATIENT_NAV,
  Doctor: DOCTOR_NAV,
  Admin: ADMIN_NAV,
};

export function TopNavbar() {
  const { user, role } = useSession();
  const { logout } = useAuth();
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[role ?? ''] ?? [];
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  const T = 'all 0.25s cubic-bezier(0.4,0,0.2,1)';

  return (
    <header
      className="flex h-[66px] items-center justify-between px-5 md:px-7 gap-4 flex-shrink-0 z-40 relative"
      style={{
        background:           'rgba(230,225,221,0.78)',
        backdropFilter:       'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        borderBottom:         '1px solid rgba(255,255,255,0.35)',
      }}
    >
      {/* ── Logo — no background wrapper ─────────────────────────────────── */}
      <Link
        href={role ? (NAV_BY_ROLE[role]?.[0]?.href ?? '/') : '/'}
        className="flex items-center gap-2.5 flex-shrink-0"
        aria-label="HealthConsult home"
      >
        {/* Brand icon — no individual background, gradient svg */}
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
          <rect width="30" height="30" rx="9" fill="url(#logoGrad)" />
          <rect x="13.5" y="6" width="3" height="18" rx="1.5" fill="white" />
          <rect x="6" y="13.5" width="18" height="3" rx="1.5" fill="white" />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#304F6D" />
              <stop offset="1" stopColor="#899481" />
            </linearGradient>
          </defs>
        </svg>
        <div className="hidden sm:block">
          <p className="font-bold leading-none" style={{ fontSize: 14, letterSpacing: '-0.02em', color: '#304F6D' }}>
            HealthConsult
          </p>
          <p className="text-[9px] leading-none mt-0.5 font-medium" style={{ color: '#899481' }}>
            Your trusted care partner
          </p>
        </div>
      </Link>

      {/* ── Apple Liquid-Glass Nav Capsule (desktop only) ─────────────────── */}
      {navItems.length > 0 && (
        <nav
          className="hidden md:flex items-center flex-1 justify-center"
          aria-label="Main navigation"
        >
          {/* Single frosted-glass pill container */}
          <div
            className="flex items-center"
            style={{
              background:           'rgba(255,255,255,0.22)',
              backdropFilter:       'blur(32px) saturate(200%)',
              WebkitBackdropFilter: 'blur(32px) saturate(200%)',
              border:               '1px solid rgba(255,255,255,0.55)',
              borderRadius:         9999,
              boxShadow:            '0 2px 24px rgba(48,79,109,0.09), inset 0 1.5px 0 rgba(255,255,255,0.70)',
              padding:              '4px',
              gap:                  2,
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className="transition-all duration-200 select-none whitespace-nowrap"
                  style={{
                    display:       'flex',
                    alignItems:    'center',
                    padding:       '7px 16px',
                    borderRadius:  9999,
                    fontSize:      13,
                    fontWeight:    isActive ? 600 : 500,
                    letterSpacing: '-0.01em',
                    color:         isActive ? '#304F6D' : '#6B7280',
                    background:    isActive
                      ? 'rgba(255,255,255,0.80)'
                      : 'transparent',
                    boxShadow:     isActive
                      ? '0 1px 8px rgba(48,79,109,0.13), inset 0 1px 0 rgba(255,255,255,0.80)'
                      : 'none',
                    transition:    T,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color      = '#304F6D';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.38)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color      = '#6B7280';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* ── Right Controls — NO individual backgrounds ───────────────────── */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* Search — bare icon */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
          style={{ color: '#304F6D' }}
          aria-label="Search"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(48,79,109,0.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>

        {/* Notification bell — bare icon, orange dot */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
          style={{ color: '#304F6D' }}
          aria-label="Notifications"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(48,79,109,0.08)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white"
            style={{ background: '#E07D54' }}
            aria-hidden="true"
          />
        </button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px" style={{ background: 'rgba(48,79,109,0.15)' }} aria-hidden="true" />

        {/* User avatar dropdown — no background on trigger */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full px-1.5 py-1.5 transition-all duration-200"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(48,79,109,0.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {/* Avatar — gradient circle */}
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{
                background:  'linear-gradient(135deg, #304F6D 0%, #899481 100%)',
                boxShadow:   '0 2px 8px rgba(48,79,109,0.25)',
              }}
            >
              {initials}
            </div>
            <span className="hidden md:block text-sm font-semibold pr-1" style={{ color: '#1F2937', letterSpacing: '-0.01em' }}>
              {firstName}
            </span>
            <svg
              className="hidden md:block h-3 w-3 mr-1 transition-transform duration-150"
              style={{ color: '#899481', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl z-50 overflow-hidden"
                style={{
                  background:           'rgba(255,255,255,0.94)',
                  backdropFilter:       'blur(24px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                  border:               '1px solid rgba(255,255,255,0.40)',
                  boxShadow:            '0 8px 40px rgba(48,79,109,0.14)',
                }}
              >
                {/* User info */}
                <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(48,79,109,0.07)' }}>
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #304F6D, #899481)' }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1F2937', letterSpacing: '-0.01em' }}>
                      {user?.fullName ?? 'User'}
                    </p>
                    <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#899481' }}>{role}</p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all duration-150"
                  style={{ color: '#EF4444' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
