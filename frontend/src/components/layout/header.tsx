'use client';

/**
 * Header — top app bar for dashboard screens.
 * Source of truth: frontend/SDD/doctor.md, patient.md — UI Components
 *
 * UI Refactor: Clean white topbar with shadow, user chip, notification bell.
 * All hooks, session usage, logout logic unchanged.
 */

import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useSession();
  const { logout } = useAuth();
  const router = useRouter();

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <header
      className="flex h-16 items-center justify-between px-5 md:px-7"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        flexShrink: 0,
      }}
    >
      {/* Left: Page title */}
      <div className="flex flex-col justify-center">
        <span
          className="font-bold leading-tight"
          style={{ fontSize: 18, color: '#0F172A', letterSpacing: '-0.01em' }}
        >
          {title ?? 'Dashboard'}
        </span>
        {/* Date sub-line (desktop only) */}
        <span className="hidden md:block text-xs" style={{ color: '#94A3B8', marginTop: 1 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          aria-label="Notifications"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
          }}
        >
          <svg
            className="h-4 w-4"
            style={{ color: '#64748B' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
          {/* Notification dot */}
          <span
            className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
            style={{ background: '#E07D54', boxShadow: '0 0 0 2px white' }}
            aria-hidden="true"
          />
        </button>

        {/* User chip */}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 cursor-pointer transition-all duration-150"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
          }}
        >
          {/* Avatar circle */}
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #2FA5FF 0%, #0EA5E9 100%)' }}
          >
            {initials}
          </div>
          {/* Name — desktop only */}
          {firstName && (
            <span className="hidden md:block text-sm font-semibold" style={{ color: '#1E293B' }}>
              {firstName}
            </span>
          )}
          {/* Logout — desktop only */}
          <button
            onClick={() => logout()}
            className="hidden md:flex items-center justify-center h-5 w-5 rounded-lg transition-colors"
            style={{ color: '#94A3B8' }}
            aria-label="Logout"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#EF4444';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#94A3B8';
            }}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
