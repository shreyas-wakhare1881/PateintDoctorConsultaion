import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        Patient Doctor Consultation
      </h1>
      <p className="text-muted-foreground text-lg">
        AI-powered healthcare consultation platform
      </p>
      <div className="flex gap-4">
        <Link href="/patient-login" className="rounded-md bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
          Patient Login
        </Link>
        <Link href="/doctor-login" className="rounded-md bg-green-600 px-5 py-2 text-white hover:bg-green-700">
          Doctor Login
        </Link>
        <Link href="/admin-login" className="rounded-md bg-gray-700 px-5 py-2 text-white hover:bg-gray-800">
          Admin Login
        </Link>
      </div>
    </main>
  );
}
