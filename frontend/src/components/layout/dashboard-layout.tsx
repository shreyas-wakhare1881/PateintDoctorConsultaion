'use client';

/**
 * DashboardLayout — wraps all /patient/*, /doctor/*, /admin/* pages.
 * Source of truth: frontend/SDD/*.md — Route Structure
 *
 * Desktop: fixed sidebar + scrollable main content.
 * Mobile: full-width content + fixed bottom navigation.
 */

import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileBottomNav } from './mobile-bottom-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}
