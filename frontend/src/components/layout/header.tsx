'use client';

/**
 * Header — top app bar for dashboard screens.
 * Source of truth: frontend/SDD/doctor.md, patient.md — UI Components
 */

import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/utils/cn';

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

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* Page title (mobile: brand name) */}
      <span className="font-semibold text-sm md:text-base">
        {title ?? user?.fullName ?? ''}
      </span>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell placeholder */}
        <button
          className="relative rounded-full p-2 hover:bg-muted"
          aria-label="Notifications"
        >
          <svg
            className="h-5 w-5 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
        </button>

        {/* Avatar + logout */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground',
            )}
          >
            {initials}
          </div>
          <button
            onClick={() => logout()}
            className="hidden text-xs text-muted-foreground hover:text-foreground md:block"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
