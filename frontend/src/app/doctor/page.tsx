'use client';

/**
 * Doctor Landing Page
 * Route: /doctor
 * NOT inside (auth) group — standalone page with custom layout
 *
 * Professional onboarding page: benefits, login CTA, registration CTA.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';
import { BrandMark } from '@/components/auth/brand-mark';
import { AuthIllustration } from '@/components/auth/auth-illustration';

const BENEFITS = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    title: 'Smart Scheduling',
    desc: 'Manage your availability with ease. Auto-fill your calendar from patient requests.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: 'HD Video Consultations',
    desc: 'Crystal-clear video sessions powered by LiveKit. Consult patients from anywhere.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    title: 'AI-Assisted Summaries',
    desc: 'Generate clinical consultation summaries automatically after each session.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: 'Verified Profile',
    desc: 'Build patient trust with a verified professional profile on our platform.',
  },
];

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  },
};

export default function DoctorLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-5 py-4 sm:px-8">
        <BrandMark size="sm" />
        <Link
          href={ROUTES.auth.patientLogin}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Patient Login
        </Link>
      </nav>

      <div className="mx-auto max-w-2xl px-5 pb-16 pt-6 sm:px-8">
        {/* Hero */}
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="mb-10"
        >
          <motion.div variants={stagger.item} className="mb-6 flex justify-center">
            <AuthIllustration type="doctor" className="h-44 w-full max-w-xs" />
          </motion.div>
          <motion.h1
            variants={stagger.item}
            className="text-center text-3xl font-bold leading-tight text-foreground sm:text-4xl"
          >
            Join Our Network of
            <br />
            <span className="text-primary">Trusted Doctors</span>
          </motion.h1>
          <motion.p
            variants={stagger.item}
            className="mx-auto mt-3 max-w-md text-center text-base text-muted-foreground"
          >
            Deliver world-class healthcare from anywhere. Manage your practice,
            consultations, and patient relationships — all in one place.
          </motion.p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="mb-10 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href={ROUTES.auth.login}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_2px_8px_-2px_hsl(174_62%_37%_/_0.35)] transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Doctor Sign In
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
          <Link
            href={ROUTES.auth.register}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-transparent text-sm font-semibold text-primary transition-all hover:bg-primary/6 active:scale-[0.98]"
          >
            Create Account
          </Link>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {BENEFITS.map((b) => (
            <motion.div
              key={b.title}
              variants={stagger.item}
              className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {b.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{b.title}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{b.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <svg className="h-3.5 w-3.5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
          </svg>
          End-to-end encrypted · HIPAA-aligned · Verified doctors only
        </motion.div>
      </div>
    </div>
  );
}
