import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Doctor Login' };

export default function DoctorLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Doctor Login</h1>
    </main>
  );
}
