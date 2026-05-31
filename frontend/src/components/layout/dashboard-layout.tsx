'use client';

/**
 * DashboardLayout — wraps all /patient/*, /doctor/*, /admin/* pages.
 * Source of truth: frontend/SDD/*.md — Route Structure
 *
 * Layout: TopNavbar (full-width) + scrollable page content.
 * Mobile: full-width content + fixed MobileBottomNav.
 * Sidebar removed — replaced by TopNavbar.
 */

import { TopNavbar } from './top-navbar';
import { MobileBottomNav } from './mobile-bottom-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#E6E1DD' }}>
      {/* Top navigation bar */}
      <TopNavbar />

      {/* Scrollable page content — default padding for all sub-pages */}
      <main
        className="flex-1 overflow-y-auto px-5 py-5 pb-24 md:px-7 md:py-6 md:pb-7"
        style={{ background: '#E6E1DD' }}
      >
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}
