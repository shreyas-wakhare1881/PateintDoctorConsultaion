'use client';

/**
 * SessionLoader — premium fluid glassmorphism splash.
 * Shown during session hydration and global route transitions.
 * Energy Palette: Navy #304F6D · Sage #899481 · Gold #FFE1A0
 */

import { motion } from 'framer-motion';

export function SessionLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      role="status"
      aria-label="Loading HealthConsult"
      style={{
        background: 'linear-gradient(145deg, #1b2f45 0%, #304F6D 45%, #3a6078 72%, #596a5e 100%)',
      }}
    >
      {/* ── Fluid ambient blobs ─────────────────────────────────────────── */}
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.28, 1], opacity: [0.22, 0.42, 0.22] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '6%', left: '4%',
          width: 400, height: 400,
          borderRadius: '62% 38% 72% 28% / 48% 67% 33% 52%',
          background: 'rgba(255,225,160,0.11)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1.12, 0.82, 1.12], opacity: [0.18, 0.38, 0.18] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        style={{
          position: 'absolute', bottom: '6%', right: '4%',
          width: 340, height: 340,
          borderRadius: '38% 62% 28% 72% / 62% 38% 62% 38%',
          background: 'rgba(137,148,129,0.16)',
          filter: 'blur(55px)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        aria-hidden="true"
        animate={{ scale: [0.88, 1.18, 0.88], opacity: [0.10, 0.22, 0.10] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 520, height: 520,
          borderRadius: '50%',
          background: 'rgba(48,79,109,0.28)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Glass card ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.86, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.58, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          background: 'rgba(255,255,255,0.09)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 32,
          padding: '48px 56px 44px',
          boxShadow: '0 36px 90px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.20)',
          minWidth: 230,
        }}
      >
        {/* ── Logo with ripple rings ────────────────────────────────── */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer ripple */}
          <motion.div
            animate={{ scale: [1, 1.80], opacity: [0.32, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: -24, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.28)',
            }}
          />
          {/* Middle ripple */}
          <motion.div
            animate={{ scale: [1, 1.55], opacity: [0.22, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.65 }}
            style={{
              position: 'absolute', inset: -14, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.18)',
            }}
          />
          {/* Logo icon */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(255,255,255,0.22)',
                '0 0 36px 10px rgba(255,255,255,0.08)',
                '0 0 0 0 rgba(255,255,255,0.22)',
              ],
            }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'rgba(255,255,255,0.15)',
              border: '1.5px solid rgba(255,255,255,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Plus / cross mark */}
            <div style={{
              position: 'absolute', width: '55%', height: '18%',
              background: 'rgba(255,255,255,0.96)', borderRadius: 99,
            }} />
            <div style={{
              position: 'absolute', width: '18%', height: '55%',
              background: 'rgba(255,255,255,0.96)', borderRadius: 99,
            }} />
          </motion.div>
        </div>

        {/* ── Brand text ───────────────────────────────────────────── */}
        <div style={{ textAlign: 'center' }}>
          <p style={{
            color: 'rgba(255,255,255,0.96)', fontWeight: 700,
            fontSize: 19, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2,
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
          }}>
            HealthConsult
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.48)', fontSize: 12.5, marginTop: 5,
            fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
          }}>
            Preparing your session…
          </p>
        </div>

        {/* ── Bouncing dots ────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 14 }}>
          {([0, 0.20, 0.40] as number[]).map((delay, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -7, 0], opacity: [0.40, 1, 0.40] }}
              transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut', delay }}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'rgba(255,255,255,0.72)',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
