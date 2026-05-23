import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Login' };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Admin Login</h1>
    </main>
  );
}
