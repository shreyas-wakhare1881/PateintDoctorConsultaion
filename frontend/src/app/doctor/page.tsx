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
import { AuthLayout } from '@/components/layout/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';

const BENEFITS = [
  {
    icon: (
      <svg className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    title: 'Smart Scheduling',
    desc: 'Manage your availability with ease. Auto-fill your calendar from patient requests.',
    iconBg: 'rgba(255,225,160,0.35)',
    iconColor: '#8a6a00',
  },
  {
    icon: (
      <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: 'HD Video Consultations',
    desc: 'Crystal-clear video sessions powered by LiveKit. Consult patients from anywhere.',
    iconBg: 'rgba(226,243,253,0.90)',
    iconColor: '#304F6D',
  },
  {
    icon: (
      <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    title: 'AI-Assisted Summaries',
    desc: 'Generate clinical consultation summaries automatically after each session.',
    iconBg: 'rgba(137,148,129,0.18)',
    iconColor: '#4a5c46',
  },
  {
    icon: (
      <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: 'Verified Profile',
    desc: 'Build patient trust with a verified professional profile on our platform.',
    iconBg: 'rgba(224,125,84,0.12)',
    iconColor: '#E07D54',
  },
];

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  },
};

export default function DoctorLandingPage() {
  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full"
      >
        <AuthCard>
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4"
              style={{ background: 'rgba(48,79,109,0.10)' }}
            >
              <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28 }} aria-hidden="true">
                <circle cx="16" cy="10" r="5" fill="#304F6D" opacity=".15" />
                <circle cx="16" cy="10" r="5" stroke="#304F6D" strokeWidth="1.8" />
                <path d="M6 27c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#304F6D" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M22 20h4m-2-2v4" stroke="#E07D54" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ color: '#1F2937', letterSpacing: '-0.03em', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
            >
              Join Our Network of<br />
              <span style={{ color: '#304F6D' }}>Trusted Doctors</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: '#6B7280' }}>
              Deliver world-class healthcare from anywhere. Manage your practice,
              consultations, and patient relationships — all in one place.
            </p>
          </div>

          {/* ── CTA Buttons ────────────────────────────────────────── */}
          <div className="flex gap-3 mb-6">
            <Link
              href={ROUTES.doctor.login}
              className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #304F6D 0%, #3a6078 100%)', color: '#FFFFFF', boxShadow: '0 4px 14px rgba(48,79,109,0.35)' }}
            >
              Doctor Sign In
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link
              href={ROUTES.doctor.register}
              className="flex flex-1 h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ border: '1.5px solid rgba(48,79,109,0.30)', color: '#304F6D', background: 'rgba(48,79,109,0.05)' }}
            >
              Create Account
            </Link>
          </div>

          {/* ── Divider ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-5">
            <div style={{ flex: 1, height: 1, background: 'rgba(48,79,109,0.10)' }} />
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Platform features</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(48,79,109,0.10)' }} />
          </div>

          {/* ── Benefits ────────────────────────────────────────────── */}
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 gap-2.5"
          >
            {BENEFITS.map((b) => (
              <motion.div
                key={b.title}
                variants={stagger.item}
                className="flex flex-col gap-2 rounded-xl p-3"
                style={{ background: 'rgba(241,245,249,0.60)', border: '1px solid rgba(48,79,109,0.07)' }}
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ background: b.iconBg, color: b.iconColor }}
                >
                  {b.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight" style={{ color: '#1F2937' }}>{b.title}</div>
                  <div className="mt-0.5 text-[11px] leading-relaxed" style={{ color: '#6B7280' }}>{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Trust badge ─────────────────────────────────────────── */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs" style={{ color: '#899481' }}>
            <svg style={{ width: 13, height: 13 }} fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
            </svg>
            End-to-end encrypted · HIPAA-aligned · Verified doctors only
          </div>
        </AuthCard>

        {/* Patient login link below card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.30 }}
          className="mt-4 text-center"
        >
          <Link
            href={ROUTES.patient.login}
            className="text-sm font-medium transition-opacity hover:opacity-100"
            style={{ color: 'rgba(255,255,255,0.78)', textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
          >
            ← Looking for a doctor? Patient login
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}

