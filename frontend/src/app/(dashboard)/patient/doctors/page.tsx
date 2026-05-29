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
import Image from 'next/image';
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
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
          {doctor.profileImageUrl ? (
            <Image src={doctor.profileImageUrl} alt={doctor.fullName} fill className="object-cover" sizes="48px" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
              {doctor.fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{doctor.fullName}</p>
          <p className="truncate text-xs font-medium text-primary">{doctor.specialization ?? 'General Physician'}</p>
          {doctor.qualification && <p className="truncate text-xs text-muted-foreground">{doctor.qualification}</p>}
        </div>
      </div>
      {doctor.hospitalName && (
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <span>Hospital:</span><span className="truncate">{doctor.hospitalName}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <span className="text-muted-foreground">{doctor.experienceYears != null ? `${doctor.experienceYears} yrs exp` : '-'}</span>
        <span className="truncate text-right text-muted-foreground">{[doctor.city, doctor.state].filter(Boolean).join(', ') || '-'}</span>
        <span className="text-muted-foreground">{doctor.rating != null ? `${doctor.rating.toFixed(1)} stars (${doctor.totalReviews})` : 'No reviews'}</span>
        <span className="text-right font-semibold text-foreground">{doctor.consultationFee != null ? `Rs.${doctor.consultationFee}` : '-'}</span>
      </div>
      {doctor.languagesSpoken.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {doctor.languagesSpoken.slice(0, 3).map((lang) => (
            <span key={lang} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{lang}</span>
          ))}
          {doctor.languagesSpoken.length > 3 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{doctor.languagesSpoken.length - 3}</span>
          )}
        </div>
      )}
      <Link href={ROUTES.patient.doctorProfile(doctor.doctorId)} className="mt-auto flex h-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
        View Profile
      </Link>
    </div>
  );
}

function DoctorCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      </div>
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="grid grid-cols-2 gap-2"><div className="h-3 rounded bg-muted" /><div className="h-3 rounded bg-muted" /></div>
      <div className="flex gap-1"><div className="h-5 w-12 rounded-full bg-muted" /><div className="h-5 w-14 rounded-full bg-muted" /></div>
      <div className="h-9 rounded-lg bg-muted" />
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
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={loading} className="h-9 rounded-lg border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60">
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function ActiveFilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      {label}
      <button onClick={onRemove} className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20" aria-label={`Remove ${label}`}>x</button>
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
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Find a Doctor</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Search naturally: &ldquo;heart doctor in Pune under 1000&rdquo; or use filters below.
          </p>
        </div>
        {totalCount > 0 && !isLoading && (
          <p className="self-end whitespace-nowrap text-sm text-muted-foreground sm:self-auto">
            {totalCount} {totalCount === 1 ? 'doctor' : 'doctors'} found
          </p>
        )}
      </div>

      {/* ── Search bar + sort ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          {/* Search icon */}
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            &#128269;
          </span>
          {/* NLP badge */}
          {isNlpMode && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
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
            className="h-10 w-full rounded-lg border bg-background pl-8 pr-16 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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
          <label className="whitespace-nowrap text-sm text-muted-foreground">Sort:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
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
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <span>
            Did you mean{' '}
            <button
              type="button"
              className="font-semibold underline underline-offset-2 transition-colors hover:text-amber-900 dark:hover:text-amber-200"
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
            className="shrink-0 rounded p-0.5 transition-colors hover:bg-amber-200 dark:hover:bg-amber-800"
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
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Experience</label>
          <select value={experienceKey} onChange={(e) => setExp(e.target.value)} className="h-9 rounded-lg border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Any experience</option>
            {EXPERIENCE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fee</label>
          <select value={feeKey} onChange={(e) => setFee(e.target.value)} className="h-9 rounded-lg border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="">Any fee</option>
            {FEE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Active filter badges ────────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f, i) => <ActiveFilterBadge key={i} label={f.label} onRemove={f.onRemove} />)}
          <button onClick={clearAll} className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground">Clear all</button>
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
