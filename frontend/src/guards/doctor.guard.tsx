'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function DoctorGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/doctor-login');
      return;
    }
    if (user?.role !== 'Doctor') {
      router.replace(`/${user?.role.toLowerCase()}/dashboard`);
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'Doctor') return null;

  return <>{children}</>;
}
