'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function PatientGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/patient-login');
      return;
    }
    if (user?.role !== 'Patient') {
      router.replace(`/${user?.role.toLowerCase()}/dashboard`);
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'Patient') return null;

  return <>{children}</>;
}
