'use client';

/**
 * MobileBottomNav — bottom navigation bar for mobile dashboard.
 * Source of truth: frontend/SDD/patient.md, doctor.md, admin.md — Responsive Notes
 *
 * Visible only on mobile (md:hidden). Role-aware menu items.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useSession } from '@/hooks/use-session';
import { ROUTES } from '@/config/routes';

interface BottomNavItem {
  label: string;
  href: string;
}

const PATIENT_BOTTOM: BottomNavItem[] = [
  { label: 'Home', href: ROUTES.patient.dashboard },
  { label: 'Search', href: ROUTES.patient.doctors },
  { label: 'Consultations', href: ROUTES.patient.consultations },
  { label: 'Prescriptions', href: ROUTES.patient.prescriptions },
  { label: 'Profile', href: ROUTES.patient.profile },
];

const DOCTOR_BOTTOM: BottomNavItem[] = [
  { label: 'Dashboard', href: ROUTES.doctor.dashboard },
  { label: 'Consultations', href: ROUTES.doctor.consultations },
  { label: 'Availability', href: ROUTES.doctor.availability },
  { label: 'Profile', href: ROUTES.doctor.profile },
];

const ADMIN_BOTTOM: BottomNavItem[] = [
  { label: 'Dashboard', href: ROUTES.admin.dashboard },
  { label: 'Doctors', href: ROUTES.admin.doctors },
  { label: 'Patients', href: ROUTES.admin.patients },
  { label: 'Logs', href: ROUTES.admin.auditLogs },
];

const NAV_BY_ROLE: Record<string, BottomNavItem[]> = {
  Patient: PATIENT_BOTTOM,
  Doctor: DOCTOR_BOTTOM,
  Admin: ADMIN_BOTTOM,
};

export function MobileBottomNav() {
  const { role } = useSession();
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role ?? ''] ?? [];

  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-card md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
            pathname.startsWith(item.href)
              ? 'text-primary'
              : 'text-muted-foreground'
          )}
        >
          <span className="h-5 w-5" /> {/* Icon slot — filled per item in future */}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
