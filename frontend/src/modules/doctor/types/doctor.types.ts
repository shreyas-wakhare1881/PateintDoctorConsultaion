/**
 * Doctor Module Types
 * Aligned 1:1 with backend/Modules/Doctor/DTOs/DoctorDto.cs (camelCase mapped)
 * and backend/Modules/Doctor/SDD/APIs.md response shapes.
 */

export type DoctorApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Suspended';

// ─── Authenticated Doctor Profile ─────────────────────────────────────────────

/** Maps: DoctorProfileResponse — full private profile for authenticated doctor */
export type DoctorProfileDto = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  licenseNumber: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  consultationFee: number | null;
  hospitalName: string | null;
  clinicAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languagesSpoken: string[];
  approvalStatus: DoctorApprovalStatus;
  rating: number | null;
  totalReviews: number;
  totalConsultations: number;
  isProfileCompleted: boolean;
  isPubliclyVisible: boolean;
  createdAt: string;
  updatedAt: string | null;
};

// ─── Public Doctor Listing ────────────────────────────────────────────────────

/** Maps: DoctorPublicListItemResponse — used in patient doctor search */
export type DoctorPublicListItem = {
  id: string;
  fullName: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  rating: number | null;
  totalReviews: number;
  city: string | null;
  languagesSpoken: string[];
  profileImageUrl: string | null;
};

/** Maps: DoctorPublicDetailResponse — full public detail + availability */
export type DoctorPublicDetail = {
  id: string;
  fullName: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  bio: string | null;
  consultationFee: number | null;
  hospitalName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languagesSpoken: string[];
  rating: number | null;
  totalReviews: number;
  profileImageUrl: string | null;
  availability: DoctorPublicAvailabilitySlot[];
};

export type DoctorPublicAvailabilitySlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

// ─── Availability ─────────────────────────────────────────────────────────────

/** Maps: AvailabilityResponse */
export type DoctorAvailabilitySlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
};

// ─── Doctor Search Params (legacy — used by existing /api/doctors) ────────────

export type DoctorSearchParams = {
  city?: string;
  specialization?: string;
  language?: string;
  minFee?: number;
  maxFee?: number;
  page?: number;
  pageSize?: number;
};

// ─── Doctor Discovery Types (Phase 2 — /api/discovery/doctors) ───────────────

/** Maps: DoctorSearchRequest — rich filter/sort/paginate model for discovery */
export type DoctorDiscoveryRequest = {
  searchTerm?: string;
  specialization?: string;
  city?: string;
  state?: string;
  language?: string;
  minExperience?: number;
  maxExperience?: number;
  minConsultationFee?: number;
  maxConsultationFee?: number;
  /** 'fee' | 'experience' | 'rating' | 'name' | 'relevance' */
  sortBy?: 'fee' | 'experience' | 'rating' | 'name' | 'relevance';
  /** default 'asc' */
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

/** Maps: DoctorSearchResult — doctor card data returned by discovery endpoint */
export type DoctorDiscoveryResult = {
  doctorId: string;
  fullName: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  rating: number | null;
  totalReviews: number;
  hospitalName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languagesSpoken: string[];
  profileImageUrl: string | null;
  isPubliclyVisible: boolean;
  /** Relevance score [0.0–1.0+] from SearchRankingService. Only present for NLP searches. */
  relevanceScore?: number;
};

/** Maps: DiscoveryFilterOptions — dynamic dropdown values from actual doctor data */
export type DiscoveryFilterOptions = {
  specializations: string[];
  cities: string[];
  languages: string[];
};

export type AvailabilityStatus = 'Available' | 'Busy' | 'Offline';

// ─── NLP Search Types (Sprint 1 — /api/discovery/nlp-search) ─────────────────

/** Maps: NlpSearchRequest */
export type NlpSearchRequest = {
  query: string;
  // Optional explicit overrides (win over NLP-inferred values)
  specialization?: string;
  city?: string;
  language?: string;
  maxConsultationFee?: number;
  minConsultationFee?: number;
  minExperience?: number;
  maxExperience?: number;
  sortBy?: 'fee' | 'experience' | 'rating' | 'name' | 'relevance';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
};

/** Maps: ParsedIntentDto — what the NLP engine understood from the query */
export type ParsedIntentDto = {
  specialization: string | null;
  city: string | null;
  language: string | null;
  maxConsultationFee: number | null;
  minConsultationFee: number | null;
  minExperience: number | null;
  maxExperience: number | null;
  gender: string | null;
  /** Human-readable summary, e.g. "Cardiologist in Mumbai, fee ≤ ₹1000" */
  summary: string;
  /** Confidence score [0.0–1.0] indicating how well the NLP understood the query */
  confidenceScore: number;
};

/** Maps: NlpSearchResponse */
export type NlpSearchResponse = {
  results: import('@/types/api.types').PaginatedResponse<DoctorDiscoveryResult>;
  parsedIntent: ParsedIntentDto;
  originalQuery: string;
  /** Spelling correction suggestion ("Did you mean...?"). Null when no correction was needed. */
  didYouMean?: string | null;
  /** Whether the fuzzy corrector modified the query before searching. */
  fuzzyMatchApplied?: boolean;
};

/** Maps: SuggestionType enum */
export type SuggestionType = 'Specialization' | 'Synonym' | 'Symptom';

/** Maps: SearchSuggestion */
export type SearchSuggestion = {
  /** Display text (may include " → Cardiologist" for synonyms) */
  text: string;
  /** Value to set in the search box */
  canonicalValue: string;
  type: SuggestionType;
};

