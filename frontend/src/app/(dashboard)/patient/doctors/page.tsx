'use client';

/**
 * Patient — Find Doctors  (Sprint 1 NLP Edition)
 * Route: /patient/doctors
 *
 * Dual-mode search:
 *   — When search box has text → NLP mode: GET /api/discovery/nlp-search
 *   — When only filters active  → Structured mode: GET /api/discovery/doctors
 *
 * NLP mode shows:
 *   • Auto-complete suggestions dropdown (GET /api/discovery/suggestions)
 *   • Parsed-intent summary "Searching as: Cardiologist in Mumbai, fee ≤ ₹1000"
 *
 * Explicit dropdown filters always take priority over NLP-inferred values.
 * All state stored in URL searchParams for shareable, back-button-compatible URLs.
 */

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { PatientGuard } from '@/guards/patient.guard';
import {
  useDoctorDiscoverySearch,
  useDiscoveryFilterOptions,
  useNlpSearch,
  useSearchSuggestions,
} from '@/modules/doctor/hooks/useDoctor';
import type {
  DoctorDiscoveryResult,
  DoctorDiscoveryRequest,
  NlpSearchRequest,
  SearchSuggestion,
} from '@/modules/doctor/types/doctor.types';
import { EmptyState } from '@/components/shared/empty-state';
import { DoctorAvatar } from '@/components/shared/DoctorAvatar';
import { ROUTES } from '@/config/routes';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'name:asc',        label: 'Name A to Z' },
  { value: 'name:desc',       label: 'Name Z to A' },
  { value: 'experience:desc', label: 'Experience High to Low' },
  { value: 'experience:asc',  label: 'Experience Low to High' },
  { value: 'fee:asc',         label: 'Fee Low to High' },
  { value: 'fee:desc',        label: 'Fee High to Low' },
  { value: 'rating:desc',     label: 'Rating High to Low' },
  { value: 'relevance:desc',  label: 'Best Match (NLP)' },
] as const;

const EXPERIENCE_RANGES = [
  { label: '0-5 years',   key: '0-5',   min: 0,  max: 5 },
  { label: '5-10 years',  key: '5-10',  min: 5,  max: 10 },
  { label: '10-15 years', key: '10-15', min: 10, max: 15 },
  { label: '15+ years',   key: '15+',   min: 15, max: undefined as number | undefined },
] as const;

const FEE_RANGES = [
  { label: 'Up to 500',     key: '0-500',     min: 0,    max: 500 },
  { label: '500-1000',      key: '500-1000',  min: 500,  max: 1000 },
  { label: '1000-2000',     key: '1000-2000', min: 1000, max: 2000 },
  { label: '2000+',         key: '2000+',     min: 2000, max: undefined as number | undefined },
] as const;

// ── Suggestion dropdown ────────────────────────────────────────────────────────
function SuggestionsDropdown({
  suggestions,
  onSelect,
}: {
  suggestions: SearchSuggestion[];
  onSelect: (s: SearchSuggestion) => void;
}) {
  if (suggestions.length === 0) return null;
  return (
    <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border bg-popover shadow-lg">
      {suggestions.map((s, idx) => (
        <li key={idx}>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="flex-1 truncate">{s.text}</span>
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {s.type === 'Synonym' ? 'synonym' : s.type === 'Symptom' ? 'symptom' : 'specialization'}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ── Doctor card ────────────────────────────────────────────────────────────────
function DoctorCard({ doctor }: { doctor: DoctorDiscoveryResult }) {
  const [hovered, setHovered] = useState(false);
  const stars = doctor.rating != null ? Math.round(doctor.rating) : 0;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 24,
        height: 360,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-6px) scale(1.012)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? '0 28px 64px rgba(48,79,109,0.22), 0 8px 24px rgba(48,79,109,0.10)'
          : '0 4px 24px rgba(48,79,109,0.11)',
        transition: 'all 0.42s cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Layer 1: Navy gradient background ──────────────────── */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(155deg, #304F6D 0%, #1d3347 55%, #4a5e50 100%)' }}
      >
        <div className="pointer-events-none absolute -top-10 -right-10 rounded-full" style={{ width: 170, height: 170, background: 'rgba(255,225,160,0.10)' }} />
        <div className="pointer-events-none absolute bottom-28 -left-8 rounded-full" style={{ width: 110, height: 110, background: 'rgba(255,255,255,0.05)' }} />
        <div className="pointer-events-none absolute top-8 left-8 rounded-full" style={{ width: 60, height: 60, background: 'rgba(137,148,129,0.12)' }} />
      </div>

      {/* ── Layer 2: Avatar + static rating (default view) ─────── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        style={{ paddingBottom: 108 }}
      >
        {/* Avatar */}
        <div
          style={{
            transform: hovered ? 'scale(0.80) translateY(-6px)' : 'scale(1) translateY(0)',
            transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
            borderRadius: '50%',
            border: '2.5px solid rgba(255,255,255,0.32)',
            boxShadow: '0 10px 36px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          <DoctorAvatar
            seed={doctor.doctorId}
            profileImageUrl={doctor.profileImageUrl}
            name={doctor.fullName}
            size={88}
            style={{ display: 'block' }}
          />
        </div>

        {/* Stars (fade out on hover) */}
        <div
          style={{
            opacity: hovered ? 0 : 1,
            transform: hovered ? 'translateY(10px)' : 'translateY(0)',
            transition: 'all 0.28s ease',
            display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} className="h-3.5 w-3.5" fill={i < stars ? '#FFE1A0' : 'none'} viewBox="0 0 24 24" stroke="#FFE1A0" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          ))}
          <span style={{ color: 'rgba(255,225,160,0.65)', fontSize: 11, marginLeft: 3 }}>
            ({doctor.totalReviews ?? 0})
          </span>
        </div>
      </div>

      {/* ── Layer 3: Dark overlay (appears on hover) ────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.35)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* ── Layer 4: Static name strip (slides away on hover) ────── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          padding: '14px 20px 18px',
          borderTop: '1px solid rgba(255,255,255,0.50)',
          transform: hovered ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <p className="truncate font-bold" style={{ color: '#1F2937', fontSize: 15, letterSpacing: '-0.02em' }}>
          {doctor.fullName}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: '#E2F3FD', color: '#304F6D' }}>
            {doctor.specialization ?? 'General Physician'}
          </span>
          <span className="font-bold" style={{ color: '#304F6D', fontSize: 14 }}>
            {doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '—'}
          </span>
        </div>
      </div>

      {/* ── Layer 5: Sliding reveal panel (slides up on hover) ───── */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          padding: '20px 20px 22px',
          transform: hovered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1)',
          borderTop: '1px solid rgba(48,79,109,0.09)',
          zIndex: 10,
        }}
      >
        {/* Name + fee header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold truncate" style={{ color: '#1F2937', fontSize: 15, letterSpacing: '-0.02em' }}>
              {doctor.fullName}
            </p>
            <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold mt-1" style={{ background: '#304F6D', color: '#FFFFFF' }}>
              {doctor.specialization ?? 'General Physician'}
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold" style={{ color: '#304F6D', fontSize: 18, letterSpacing: '-0.03em' }}>
              {doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '—'}
            </p>
            <p style={{ color: '#6B7280', fontSize: 10, marginTop: 1 }}>per consult</p>
          </div>
        </div>

        {/* Hospital */}
        {doctor.hospitalName && (
          <p className="flex items-center gap-1.5 truncate text-xs mb-2.5" style={{ color: '#6B7280' }}>
            <svg className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#899481' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>
            <span className="truncate">{doctor.hospitalName}</span>
          </p>
        )}

        {/* City + Experience */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="flex items-center gap-1 truncate" style={{ color: '#6B7280' }}>
            <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            <span className="truncate">{[doctor.city, doctor.state].filter(Boolean).join(', ') || '—'}</span>
          </span>
          {doctor.experienceYears != null && (
            <span className="font-semibold shrink-0 ml-2" style={{ color: '#304F6D' }}>
              {doctor.experienceYears} yrs exp
            </span>
          )}
        </div>

        {/* Rating + Languages */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="h-3 w-3" fill={i < stars ? '#E07D54' : 'none'} viewBox="0 0 24 24" stroke="#E07D54" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            ))}
            <span style={{ color: '#6B7280', fontSize: 10, marginLeft: 3 }}>
              {doctor.rating != null ? doctor.rating.toFixed(1) : '—'} ({doctor.totalReviews ?? 0})
            </span>
          </div>
          {doctor.languagesSpoken.length > 0 && (
            <div className="flex gap-1">
              {doctor.languagesSpoken.slice(0, 2).map((lang) => (
                <span key={lang} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'rgba(48,79,109,0.07)', color: '#304F6D' }}>{lang}</span>
              ))}
              {doctor.languagesSpoken.length > 2 && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'rgba(137,148,129,0.12)', color: '#596550' }}>+{doctor.languagesSpoken.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={ROUTES.patient.doctorProfile(doctor.doctorId)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#E07D54', color: '#000000', boxShadow: '0 4px 16px rgba(224,125,84,0.35)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
          View Profile
        </Link>
      </div>
    </div>
  );
}

function DoctorCardSkeleton() {
  return (
    <div
      className="relative overflow-hidden animate-pulse"
      style={{ borderRadius: 24, height: 360, background: 'rgba(48,79,109,0.08)' }}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(155deg, rgba(48,79,109,0.15) 0%, rgba(48,79,109,0.10) 100%)' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ paddingBottom: 108 }}>
        <div className="rounded-full" style={{ width: 88, height: 88, background: 'rgba(255,255,255,0.15)' }} />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-3.5 w-3.5 rounded-full" style={{ background: 'rgba(255,225,160,0.25)' }} />)}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0" style={{ background: 'rgba(255,255,255,0.90)', padding: '14px 20px 18px' }}>
        <div className="h-4 w-3/4 rounded-lg mb-2" style={{ background: 'rgba(48,79,109,0.09)' }} />
        <div className="flex justify-between">
          <div className="h-5 w-1/3 rounded-full" style={{ background: 'rgba(48,79,109,0.07)' }} />
          <div className="h-4 w-12 rounded-lg" style={{ background: 'rgba(48,79,109,0.07)' }} />
        </div>
      </div>
    </div>
  );
}

function PaginationControls({ page, totalPages, totalCount, pageSize, onPageChange }: {
  page: number; totalPages: number; totalCount: number; pageSize: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, totalCount);
  const pages: (number | 'gap')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) pages.push(p);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">Showing {from}-{to} of {totalCount} doctors</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors hover:bg-muted disabled:opacity-40">&laquo;</button>
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors hover:bg-muted disabled:opacity-40">&lsaquo;</button>
        {pages.map((item, idx) =>
          item === 'gap' ? (
            <span key={`gap-${idx}`} className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">...</span>
          ) : (
            <button key={item} onClick={() => onPageChange(item)} className={`flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors ${item === page ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{item}</button>
          )
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors hover:bg-muted disabled:opacity-40">&rsaquo;</button>
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} className="flex h-8 w-8 items-center justify-center rounded border text-sm transition-colors hover:bg-muted disabled:opacity-40">&raquo;</button>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, placeholder, onChange, loading }: {
  label: string; value: string; options: string[]; placeholder: string; onChange: (v: string) => void; loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="h-9 rounded-xl border bg-white px-2.5 text-sm outline-none transition-all focus:ring-2 disabled:opacity-60"
        style={{ borderColor: 'rgba(48,79,109,0.12)', color: '#1E293B', boxShadow: 'none' }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function ActiveFilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: '#E2F3FD', color: '#304F6D', border: '1px solid rgba(48,79,109,0.15)' }}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-all hover:opacity-70"
        style={{ background: 'rgba(48,79,109,0.15)', color: '#304F6D' }}
        aria-label={`Remove ${label}`}
      >×</button>
    </span>
  );
}

// ── Main page content ──────────────────────────────────────────────────────────
function FindDoctorsContent() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const inputRef     = useRef<HTMLInputElement>(null);

  const getStr = (key: string) => searchParams.get(key) ?? '';

  const [localSearch,    setLocalSearch]    = useState(() => getStr('q'));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dismissedDidYouMean, setDismissedDidYouMean] = useState<string | null>(null);

  // useDeferredValue creates a low-priority copy — lets UI stay responsive while search updates
  const deferredSearch = useDeferredValue(localSearch);

  const specialization = getStr('specialization');
  const city           = getStr('city');
  const language       = getStr('language');
  const experienceKey  = getStr('experience');
  const feeKey         = getStr('fee');
  const sort           = getStr('sort') || 'name:asc';
  const page           = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const [sortBy, sortDirection] = sort.split(':') as [DoctorDiscoveryRequest['sortBy'], 'asc' | 'desc'];
  const expRange = EXPERIENCE_RANGES.find((r) => r.key === experienceKey);
  const feeRange = FEE_RANGES.find((r) => r.key === feeKey);

  // ── NLP mode when search box has text; structured mode otherwise ──────────
  const isNlpMode = deferredSearch.trim().length > 0;

  const nlpRequest: NlpSearchRequest | null = isNlpMode
    ? {
        query: deferredSearch,
        // Explicit filters override NLP-inferred values
        ...(specialization ? { specialization }      : {}),
        ...(city           ? { city }                : {}),
        ...(language       ? { language }            : {}),
        ...(expRange       ? { minExperience: expRange.min, ...(expRange.max !== undefined ? { maxExperience: expRange.max } : {}) } : {}),
        ...(feeRange       ? { minConsultationFee: feeRange.min, ...(feeRange.max !== undefined ? { maxConsultationFee: feeRange.max } : {}) } : {}),
        sortBy,
        sortDirection,
        page,
        pageSize: PAGE_SIZE,
      }
    : null;

  const structuredRequest: DoctorDiscoveryRequest = {
    ...(specialization ? { specialization }      : {}),
    ...(city           ? { city }                : {}),
    ...(language       ? { language }            : {}),
    ...(expRange       ? { minExperience: expRange.min, ...(expRange.max !== undefined ? { maxExperience: expRange.max } : {}) } : {}),
    ...(feeRange       ? { minConsultationFee: feeRange.min, ...(feeRange.max !== undefined ? { maxConsultationFee: feeRange.max } : {}) } : {}),
    sortBy,
    sortDirection,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data: nlpData,        isLoading: nlpLoading,  isError: nlpError,  isFetching: nlpFetching }  = useNlpSearch(nlpRequest);
  const { data: structuredData, isLoading: sLoading,    isError: sError,    isFetching: sFetching }    = useDoctorDiscoverySearch(structuredRequest, { enabled: !isNlpMode });
  const { data: filterOptions,  isLoading: filtersLoading } = useDiscoveryFilterOptions();
  const { data: suggestions = [] } = useSearchSuggestions(localSearch);

  // Unified data from whichever mode is active
  const activeData  = isNlpMode ? nlpData?.results : structuredData;
  const doctors     = activeData?.items ?? [];
  const totalCount  = activeData?.totalCount ?? 0;
  const totalPages  = activeData?.totalPages ?? 1;
  const isLoading   = isNlpMode ? nlpLoading  : sLoading;
  const isError     = isNlpMode ? nlpError    : sError;
  const isFetching  = isNlpMode ? nlpFetching : sFetching;
  const intentSummary = isNlpMode ? nlpData?.parsedIntent?.summary : null;
  const didYouMean     = isNlpMode ? nlpData?.didYouMean : null;
  const showDidYouMean = didYouMean && didYouMean !== dismissedDidYouMean;

  // ── URL state helpers ─────────────────────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val !== undefined && val !== '') params.set(key, val);
        else params.delete(key);
      });
      if (resetPage && !('page' in updates)) params.delete('page');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  // Debounce search → URL sync (300 ms)
  useEffect(() => {
    const t = setTimeout(() => { updateParams({ q: deferredSearch || undefined }); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const setSpec  = (v: string) => updateParams({ specialization: v || undefined });
  const setCity  = (v: string) => updateParams({ city:           v || undefined });
  const setLang  = (v: string) => updateParams({ language:       v || undefined });
  const setExp   = (v: string) => updateParams({ experience:     v || undefined });
  const setFee   = (v: string) => updateParams({ fee:            v || undefined });
  const setSort  = (v: string) => updateParams({ sort: v }, false);
  const goPage   = (p: number) => updateParams({ page: String(p) }, false);
  const clearAll = () => { setLocalSearch(''); router.replace(pathname, { scroll: false }); };

  const handleSuggestionSelect = (s: SearchSuggestion) => {
    setLocalSearch(s.canonicalValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const activeFilters: { label: string; onRemove: () => void }[] = [
    ...(deferredSearch ? [{ label: `"${deferredSearch}"`, onRemove: () => { setLocalSearch(''); updateParams({ q: undefined }); } }] : []),
    ...(specialization ? [{ label: specialization,        onRemove: () => setSpec('') }] : []),
    ...(city           ? [{ label: city,                  onRemove: () => setCity('') }] : []),
    ...(language       ? [{ label: language,              onRemove: () => setLang('') }] : []),
    ...(expRange       ? [{ label: expRange.label,        onRemove: () => setExp('') }] : []),
    ...(feeRange       ? [{ label: feeRange.label,        onRemove: () => setFee('') }] : []),
  ];

  return (
    <div
      className="-mx-5 -my-5 md:-mx-7 md:-my-6 p-5 md:p-8 pb-24 md:pb-10 space-y-6"
      style={{ background: '#E6E1DD', minHeight: '100%', fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937', letterSpacing: '-0.02em' }}>Find a Doctor</h1>
          <p className="mt-0.5 text-sm" style={{ color: '#6B7280' }}>
            Search naturally: &ldquo;heart doctor in Pune under 1000&rdquo; or use filters below.
          </p>
        </div>
        {totalCount > 0 && !isLoading && (
          <span
            className="self-end whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold sm:self-auto"
            style={{ background: '#E2F3FD', color: '#304F6D' }}
          >
            {totalCount} {totalCount === 1 ? 'doctor' : 'doctors'} found
          </span>
        )}
      </div>

      {/* ── Search bar + sort ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          {/* Search icon */}
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#6B7280' }}>
            &#128269;
          </span>
          {/* NLP badge */}
          {isNlpMode && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: '#E2F3FD', color: '#304F6D' }}
            >
              Smart
            </span>
          )}
          <input
            ref={inputRef}
            type="search"
            placeholder='Try "heart doctor in Pune" or "skin specialist under 500"…'
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="h-10 w-full rounded-xl border bg-white pl-8 pr-16 text-sm outline-none transition-all focus:ring-2"
            style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
          />
          {/* Suggestions dropdown */}
          {showSuggestions && (
            <SuggestionsDropdown
              suggestions={suggestions}
              onSelect={handleSuggestionSelect}
            />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B7280' }}>Sort:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-xl border bg-white px-3 text-sm outline-none transition-all focus:ring-2"
            style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>


      {/* ── NLP intent summary ──────────────────────────────────────────── */}
      {isNlpMode && intentSummary && intentSummary !== 'Showing all doctors' && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          <span className="font-medium">Searching as:</span>
          <span>{intentSummary}</span>
        </div>
      )}
      {/* ── Did You Mean banner ─────────────────────────────────────── */}
      {showDidYouMean && (
        <div
        className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
        style={{ borderColor: 'rgba(224,125,84,0.30)', background: 'rgba(224,125,84,0.06)', color: '#92400e' }}>
          <span>
            Did you mean{' '}
            <button
              type="button"
              className="font-semibold underline underline-offset-2 transition-colors hover:opacity-70"
              onClick={() => { setLocalSearch(didYouMean!); }}
            >
              &ldquo;{didYouMean}&rdquo;
            </button>
            ?
          </span>
          <button
            type="button"
            onClick={() => setDismissedDidYouMean(didYouMean!)}
            aria-label="Dismiss suggestion"
            className="shrink-0 rounded p-0.5 transition-colors hover:bg-orange-100"
          >
            ✕
          </button>
        </div>
      )}
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <FilterSelect label="Specialization" value={specialization} options={filterOptions?.specializations ?? []} placeholder="All specializations" onChange={setSpec} loading={filtersLoading} />
        <FilterSelect label="City"           value={city}           options={filterOptions?.cities ?? []}           placeholder="All cities"          onChange={setCity} loading={filtersLoading} />
        <FilterSelect label="Language"       value={language}       options={filterOptions?.languages ?? []}        placeholder="Any language"         onChange={setLang} loading={filtersLoading} />
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Experience</label>
          <select
            value={experienceKey}
            onChange={(e) => setExp(e.target.value)}
            className="h-9 rounded-xl border bg-white px-2.5 text-sm outline-none transition-all focus:ring-2"
            style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
          >
            <option value="">Any experience</option>
            {EXPERIENCE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>Fee</label>
          <select
            value={feeKey}
            onChange={(e) => setFee(e.target.value)}
            className="h-9 rounded-xl border bg-white px-2.5 text-sm outline-none transition-all focus:ring-2"
            style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
          >
            <option value="">Any fee</option>
            {FEE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Active filter badges ────────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f, i) => <ActiveFilterBadge key={i} label={f.label} onRemove={f.onRemove} />)}
          <button onClick={clearAll} className="text-xs font-semibold underline underline-offset-2 transition-colors" style={{ color: '#6B7280' }}>Clear all</button>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <DoctorCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <EmptyState title="Failed to load doctors" message="Check your connection and try again." />
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors found"
          message={
            activeFilters.length > 0
              ? 'No doctors match your current filters. Try adjusting or clearing them.'
              : 'No approved doctors are available right now.'
          }
        />
      ) : (
        <>
          {isFetching && !isLoading && (
            <p className="animate-pulse text-xs text-muted-foreground">Updating results…</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {doctors.map((d) => <DoctorCard key={d.doctorId} doctor={d} />)}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={goPage}
          />
        </>
      )}
    </div>
  );
}

export default function FindDoctorsPage() {
  return (
    <PatientGuard>
      <FindDoctorsContent />
    </PatientGuard>
  );
}
