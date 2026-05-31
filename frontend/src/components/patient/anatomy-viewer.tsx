'use client';

/**
 * AnatomyViewer — Interactive 3D anatomy model for patient dashboard.
 *
 * Features:
 * - Renders anatomy.png (already transparent PNG) on the page background
 * - CSS perspective + rotateY for true 3D flip effect
 * - Mouse drag (left/right) → rotates the model on Y axis
 * - Touch swipe → same delta tracking
 * - Auto-rotates slowly when idle (0.4°/frame via rAF)
 * - Pauses auto-rotation while user is dragging
 * - mix-blend-mode: multiply ensures the gray checkerboard of PNG is invisible
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

interface AnatomyViewerProps {
  className?: string;
}

export function AnatomyViewer({ className = '' }: AnatomyViewerProps) {
  const [rotation, setRotation] = useState(0); // Y-axis degrees
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const autoRotateRef = useRef<number>(0);
  const pauseAutoRotate = useRef(false);

  // ── Auto-rotation loop ─────────────────────────────────────────────────────
  useEffect(() => {
    let lastTime = 0;
    const SPEED = 0.25; // degrees per ms

    const tick = (time: number) => {
      if (!pauseAutoRotate.current) {
        const delta = time - lastTime;
        setRotation((r) => (r + SPEED * Math.min(delta, 50)) % 360);
      }
      lastTime = time;
      autoRotateRef.current = requestAnimationFrame(tick);
    };

    autoRotateRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(autoRotateRef.current);
  }, []);

  // ── Mouse handlers ─────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    pauseAutoRotate.current = true;
    lastX.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setRotation((r) => r + delta * 0.6);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    // Resume auto-rotate after 2 seconds of inactivity
    setTimeout(() => {
      if (!isDragging.current) pauseAutoRotate.current = false;
    }, 2000);
  }, []);

  // ── Touch handlers ─────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    pauseAutoRotate.current = true;
    isDragging.current = true;
    lastX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;
    setRotation((r) => r + delta * 0.6);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    setTimeout(() => {
      if (!isDragging.current) pauseAutoRotate.current = false;
    }, 2000);
  }, []);

  // Normalize rotation to 0-360 for display
  const normalizedDeg = ((rotation % 360) + 360) % 360;
  // Calculate opacity scaling: front (0°/360°) → 1, back (180°) → 0.7
  const opacityFactor = 0.7 + 0.3 * Math.cos((normalizedDeg * Math.PI) / 180);

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      style={{ userSelect: 'none' }}
    >
      {/* 3D Perspective container */}
      <div
        style={{ perspective: '800px', perspectiveOrigin: '50% 40%' }}
        className="relative flex items-center justify-center"
      >
        <div
          style={{
            transform: `rotateY(${rotation}deg)`,
            transition: isDragging.current ? 'none' : 'transform 0.05s linear',
            transformStyle: 'preserve-3d',
            cursor: isDragging.current ? 'grabbing' : 'grab',
            opacity: opacityFactor,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src="/images/anatomy.png"
            alt="Human anatomy model"
            width={280}
            height={420}
            priority
            draggable={false}
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              // mix-blend-mode removes any residual gray from PNG on light bg
              mixBlendMode: 'multiply',
            }}
          />

          {/* Hotspot dots (like Image 2) */}
          <div
            className="absolute"
            style={{ top: '18%', left: '46%', transform: 'translate(-50%,-50%)' }}
            aria-hidden="true"
          >
            <HotspotDot label="Heart Rate" sublabel="72 bpm" color="#EF4444" />
          </div>
          <div
            className="absolute"
            style={{ top: '32%', left: '40%', transform: 'translate(-50%,-50%)' }}
            aria-hidden="true"
          >
            <HotspotDot label="Blood Pressure" sublabel="120/80" color="#2FA5FF" small />
          </div>
          <div
            className="absolute"
            style={{ top: '55%', left: '52%', transform: 'translate(-50%,-50%)' }}
            aria-hidden="true"
          >
            <HotspotDot label="Blood Sugar" sublabel="95 mg/dL" color="#10B981" small />
          </div>
        </div>
      </div>

      {/* Ellipse shadow under feet */}
      <div
        className="mt-1 rounded-full"
        style={{
          width: 120,
          height: 16,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 70%)',
          transform: `scaleX(${0.7 + 0.3 * Math.abs(Math.cos((rotation * Math.PI) / 180))})`,
        }}
      />

      {/* Rotation hint */}
      <p className="mt-3 text-[10px] font-medium flex items-center gap-1" style={{ color: '#94A3B8' }}>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Drag to rotate
      </p>
    </div>
  );
}

// ── Hotspot dot ─────────────────────────────────────────────────────────────
interface HotspotDotProps {
  label: string;
  sublabel: string;
  color: string;
  small?: boolean;
}

function HotspotDot({ label, sublabel, color, small }: HotspotDotProps) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {/* Outer pulse ring */}
      <div
        className="absolute rounded-full animate-ping opacity-50"
        style={{
          inset: -4,
          background: color,
        }}
      />
      {/* Inner dot */}
      <div
        className="relative rounded-full border-2 border-white shadow-md"
        style={{
          width: small ? 10 : 12,
          height: small ? 10 : 12,
          background: color,
          boxShadow: `0 0 0 3px ${color}33`,
        }}
      />
      {/* Tooltip card (Image 2 style) */}
      {show && !small && (
        <div
          className="absolute left-5 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 shadow-lg whitespace-nowrap z-10"
          style={{
            background: 'rgba(255,255,255,0.95)',
            border: `1px solid ${color}44`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="rounded-lg p-1.5" style={{ background: `${color}22` }}>
              <svg className="h-4 w-4" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-medium" style={{ color: '#64748B' }}>{label}</p>
              <p className="text-sm font-bold" style={{ color: '#0F172A' }}>{sublabel}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
