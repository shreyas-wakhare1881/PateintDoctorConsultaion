# PatientDoctorConsultation — Complete Architecture & Folder Structure Guide

> **Document Purpose:** Permanent project documentation, onboarding guide, architecture learning guide, and future reference for every developer (beginner or advanced) working on this codebase.
>
> **Written by:** Architecture & SDD walkthrough — covers *what*, *why*, and *how* for every folder, file, and execution flow in the system.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Root Folder Explanation](#3-root-folder-explanation)
4. [Frontend Detailed Explanation](#4-frontend-detailed-explanation)
5. [Backend Detailed Explanation](#5-backend-detailed-explanation)
6. [Database Flow](#6-database-flow)
7. [Authentication Flow](#7-authentication-flow)
8. [Realtime Flow](#8-realtime-flow)
9. [Video Consultation Flow](#9-video-consultation-flow)
10. [AI Service Flow](#10-ai-service-flow)
11. [Project Execution Flow](#11-project-execution-flow)
12. [Why This Architecture Is Good](#12-why-this-architecture-is-good)
13. [Current Project Status](#13-current-project-status)
14. [Learning Explanation (Beginner-Friendly)](#14-learning-explanation-beginner-friendly)
15. [Best Practices](#15-best-practices)
16. [Complete Folder Tree](#16-complete-folder-tree)

---

## 1. Project Overview

### What Is This Project?

**PatientDoctorConsultation (PDC)** is an AI-powered telemedicine platform that connects patients with doctors through real-time video consultations. Think of it as a private video-call clinic — a patient opens the app, books an appointment with a doctor, joins a video call, and after the call, an AI automatically generates a medical summary of the conversation.

### What Problem Does It Solve?

| Traditional Healthcare Problem | PDC Solution |
|---|---|
| Patient has to physically visit a clinic for minor issues | Online video consultation from anywhere |
| Doctor cannot reach remote patients | Any doctor available online can be booked |
| No automatic consultation records | AI-generated clinical summary after every call |
| Manual appointment booking (phone calls) | In-app booking system with availability management |
| Doctors accept all patients indiscriminately | Admin verifies and approves doctors before they go live |

### Why This Architecture Was Chosen

This project uses a **Modular Monolith** architecture — not a simple single application, and not microservices either. It sits in the middle on purpose.

**Simple analogy:** Imagine a big company building with clearly labeled departments — HR, Finance, Sales, IT. Each department handles its own work and has its own files. But they all share the same building (one server), the same database, and talk through internal corridors (not the internet). That is a modular monolith.

**Why not microservices?** The project is in early-stage development. Microservices require complex infrastructure (Kubernetes, service mesh, distributed tracing). Building that now would slow development by 10x. The modular monolith lets you extract individual modules into microservices later — just unplug a module and deploy it separately.

**Why not a simple monolith?** A simple monolith puts everything in one project with no separation. When the codebase grows, it becomes spaghetti. Boundaries blur, everything depends on everything. That is impossible to maintain or scale.

### Why Spec Driven Development (SDD)?

SDD means: **write the spec (specification) before writing the code.** Every module in this project has a `/SDD/` folder containing:

- `README.md` — what the module does and its boundaries
- `APIs.md` — every API endpoint the module will expose
- `Database.md` — every table the module will own
- `Flow.md` — step-by-step execution flow

This answers: *"Where do I start when implementing a new feature?"* Answer: Open the SDD folder, read the spec, then implement. The spec is the contract. You never implement something that isn't in the spec.

### How This System Will Scale

```
Phase 1 (Current)  → Modular Monolith — single deployment
Phase 2 (6 months) → Extract AI Service to separate container
Phase 3 (1 year)   → Extract Consultation module → microservice
Phase 4 (2 years)  → Full microservices if traffic demands
```

Because modules are self-contained with no direct code dependencies between them (they only share database and `Shared/` contracts), extracting a module means: copy its project folder, add its own database schema, point it to a message broker instead of direct calls. Architecture already supports this.

---

## 2. High-Level System Architecture

### Simple Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                         │
│                    Next.js 16 Frontend (Port 3000)              │
│          React + TypeScript + TailwindCSS + Zustand             │
└──────────────┬──────────────┬───────────────┬───────────────────┘
               │ HTTP/HTTPS   │ WebSocket      │ WebRTC
               │ REST API     │ SignalR        │ LiveKit
               ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ASP.NET Core Backend (Port 5000)              │
│              Modular Monolith — 9 C# Class Libraries            │
│  ┌─────────┐ ┌──────┐ ┌──────────┐ ┌──────┐ ┌─────────────┐   │
│  │  Auth   │ │ Doc  │ │ Patient  │ │Admin │ │Consultation │   │
│  │ Module  │ │ Mod  │ │  Module  │ │ Mod  │ │   Module    │   │
│  └────┬────┘ └──┬───┘ └────┬─────┘ └──┬───┘ └──────┬──────┘   │
│       │         │          │           │             │          │
│  ┌────▼─────────▼──────────▼───────────▼─────────────▼──────┐  │
│  │                Infrastructure Layer                        │  │
│  │  Persistence │ Identity │ Realtime │ AI Client │ Storage  │  │
│  └──────────────────────────┬──────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
          ┌───────────────────┼──────────────────┐
          ▼                   ▼                  ▼
   ┌─────────────┐   ┌──────────────┐   ┌──────────────┐
   │ PostgreSQL  │   │   Ollama     │   │  LiveKit     │
   │  Database   │   │ (AI Runtime) │   │ Video Server │
   └─────────────┘   └──────┬───────┘   └──────────────┘
                            │
                     ┌──────▼───────┐
                     │  FastAPI     │
                     │ AI Service   │
                     │  Port 8000   │
                     │ BioMistral   │
                     └──────────────┘
```

### Request Flow (HTTP)

```
User clicks button
     ↓
React component calls API function in modules/*/api/
     ↓
api-client.ts (Axios) attaches JWT Bearer token
     ↓
HTTP request reaches backend: POST /api/consultation
     ↓
ExceptionMiddleware (wraps everything in try-catch)
     ↓
RequestLoggingMiddleware (logs method, path)
     ↓
JwtMiddleware (custom hook point)
     ↓
Authentication Middleware (validates JWT)
     ↓
Authorization Middleware (checks role claim)
     ↓
Controller action method
     ↓
FluentValidation validates request DTO
     ↓
Service layer executes business logic
     ↓
Repository / EF Core queries PostgreSQL
     ↓
Response mapped to DTO via AutoMapper
     ↓
BaseResponse<T> wrapper returned
     ↓
Frontend receives JSON, updates Zustand store
     ↓
React re-renders UI
```

### Authentication Flow (Overview)

```
User submits login form
     ↓
POST /api/auth/login
     ↓
AuthService validates email/password hash
     ↓
JwtTokenGenerator creates signed JWT (HMAC-SHA256)
     ↓
Token returned to frontend in AuthTokenResponse
     ↓
Zustand auth.store persists token to localStorage
     ↓
Every future API request: Axios interceptor adds Authorization: Bearer <token>
     ↓
Backend validates token signature, issuer, audience, expiry on each request
```

### Realtime Flow (SignalR)

```
User logs in → isAuthenticated = true
     ↓
SocketProvider useEffect fires (client-side only)
     ↓
getConsultationHubConnection() creates HubConnection (lazy, browser only)
     ↓
Connection established: ws://localhost:5000/hubs/consultation
     ↓
Server pushes events: ConsultationStatusChanged, IncomingCall, etc.
     ↓
Frontend receives event, updates consultation.store
     ↓
UI re-renders to show new consultation status
```

### AI Flow

```
Consultation ends
     ↓
Backend Consultation module triggers AI summary
     ↓
BioMistralService.SummarizeConsultationAsync(transcript)
     ↓
OllamaClient.GenerateAsync("biomistral", prompt)
     ↓
POST http://ollama:11434/api/generate
     ↓
BioMistral model processes clinical prompt
     ↓
Summary text returned
     ↓
Saved to Consultation.AiSummary column in PostgreSQL
     ↓
Doctor and Patient can view summary from their dashboards
```

---

## 3. Root Folder Explanation

```
PateintDoctorConsultaion/       ← Root of entire project
├── frontend/                   ← Next.js client application
├── backend/                    ← ASP.NET Core server application
├── ai-services/                ← Python FastAPI AI microservice
├── docs/                       ← All architecture documentation
├── scripts/                    ← DevOps setup and seed scripts
├── .gitignore
├── LICENSE
└── README.md
```

---

### `frontend/`

**Purpose:** The user-facing web application. Everything the user sees and interacts with lives here.

**Responsibilities:**
- Render pages for Patient, Doctor, and Admin roles
- Communicate with the backend via REST API (Axios)
- Maintain real-time connection with backend via SignalR
- Manage video consultations via LiveKit
- Store session state (auth, theme, active consultation) locally

**What should go here:**
- React components, pages, styles, frontend-only logic
- State management (Zustand stores)
- API call functions (in `modules/*/api/`)
- Route guards, providers, hooks

**What should NEVER go here:**
- Database queries
- Secret keys or private credentials
- Server-side business logic
- Backend domain models

---

### `backend/`

**Purpose:** The core application server. All business logic, database operations, authentication, and real-time event broadcasting live here.

**Responsibilities:**
- Expose REST API endpoints
- Validate requests, execute business logic
- Query PostgreSQL via EF Core
- Issue and validate JWT tokens
- Broadcast SignalR events
- Call AI services for summary generation
- Manage file uploads

**What should go here:**
- All C# source code
- Domain models, services, controllers, validators
- EF Core migrations and entity configurations
- SignalR hubs

**What should NEVER go here:**
- Frontend React code
- Raw SQL queries without good reason (use EF Core)
- Business logic inside controllers (it belongs in services)

---

### `ai-services/`

**Purpose:** A standalone Python microservice that handles AI-powered clinical text generation. It is a separate process because Python has the best ecosystem for AI/ML libraries. ASP.NET Core does not run Ollama or BioMistral natively.

**Responsibilities:**
- Accept consultation transcripts via HTTP
- Forward prompts to Ollama with the BioMistral model
- Return structured clinical summaries

**What should go here:**
- FastAPI route handlers
- Pydantic request/response models
- Prompt templates
- Ollama HTTP client

**What should NEVER go here:**
- Database access (it is stateless)
- Authentication logic (backend handles that)
- Frontend-facing endpoints (only backend calls AI services)

---

### `docs/`

**Purpose:** The "brain" of the project — all architecture decisions, API contracts, database schema, and setup instructions. When a new developer joins, this is the first folder they read.

**Files:**
| File | Purpose |
|---|---|
| `Architecture.md` | High-level system overview |
| `APIContracts.md` | All REST endpoints, request/response shapes |
| `ERDiagram.md` | Entity relationship diagram for the database |
| `SDDGuide.md` | How to use Spec Driven Development on this project |
| `SetupGuide.md` | Step-by-step local development setup |
| `folderstructure.md` | **This file** — complete architecture walkthrough |

**What should NEVER go here:**
- Source code
- Build artifacts

---

### `scripts/`

**Purpose:** Automation scripts for setting up and seeding the development environment. These are run once when a new developer clones the repository.

**Files:**
| File | Purpose |
|---|---|
| `setup.ps1` | PowerShell: runs `dotnet restore`, EF Core migrations, `npm install`, `pip install` in sequence |
| `seed.sql` | SQL seed data for development — initial admin user, sample doctors, etc. |

---

## 4. Frontend Detailed Explanation

### Folder Overview

```
frontend/
├── src/
│   ├── app/           ← Next.js App Router pages (URL structure)
│   ├── components/    ← Reusable UI components
│   ├── modules/       ← Feature-specific business logic (API, hooks, types)
│   ├── providers/     ← React Context providers (auth, query, socket, theme)
│   ├── guards/        ← Route protection components
│   ├── store/         ← Zustand global state stores
│   ├── services/      ← Low-level HTTP and SignalR clients
│   ├── config/        ← Environment variables, API URLs, socket config
│   ├── hooks/         ← Global reusable hooks
│   ├── utils/         ← Pure utility/helper functions
│   ├── types/         ← Global TypeScript type definitions
│   └── styles/        ← Global CSS (TailwindCSS)
├── public/            ← Static assets (avatars, icons, images)
├── next.config.js     ← Next.js configuration
├── tailwind.config.ts ← TailwindCSS theme configuration
├── tsconfig.json      ← TypeScript compiler configuration
└── package.json       ← Dependencies and npm scripts
```

---

### `src/app/` — Pages (URL Routing)

**Purpose:** This folder IS your application's URL structure. In Next.js App Router, every `page.tsx` inside `app/` becomes a URL route. The folder name = the URL path.

**Real-world analogy:** Think of `app/` as the reception desk of a hotel. Each room number (folder) corresponds to a physical room (page). When a guest (browser) asks for room `/patient-login`, the reception desk gives them exactly that room.

```
src/app/
├── layout.tsx                          → http://localhost:3000 (root shell)
├── page.tsx                            → http://localhost:3000/
├── (auth)/                             → Route group — NO URL segment added
│   ├── patient-login/page.tsx          → /patient-login
│   ├── doctor-login/page.tsx           → /doctor-login
│   ├── admin-login/page.tsx            → /admin-login
│   └── otp-verification/page.tsx       → /otp-verification
├── (dashboard)/                        → Route group — NO URL segment added
│   ├── patient/
│   │   ├── dashboard/page.tsx          → /patient/dashboard
│   │   ├── doctors/page.tsx            → /patient/doctors
│   │   ├── profile/page.tsx            → /patient/profile
│   │   └── consultation-history/page.tsx → /patient/consultation-history
│   ├── doctor/
│   │   ├── dashboard/page.tsx          → /doctor/dashboard
│   │   ├── consultations/page.tsx      → /doctor/consultations
│   │   ├── availability/page.tsx       → /doctor/availability
│   │   └── profile/page.tsx            → /doctor/profile
│   └── admin/
│       ├── dashboard/page.tsx          → /admin/dashboard
│       ├── doctors/page.tsx            → /admin/doctors
│       └── consultations/page.tsx      → /admin/consultations
└── consultation/
    └── video-call/[roomId]/page.tsx    → /consultation/video-call/abc123
```

**Route Groups `(auth)` and `(dashboard)`:** Parentheses tell Next.js "group these routes together for organization but don't add this folder name to the URL." So `/patient-login` works, not `/(auth)/patient-login`.

**Dynamic Route `[roomId]`:** Square brackets mean this segment is variable. When a patient visits `/consultation/video-call/xyz789`, the page receives `params.roomId = "xyz789"`. This is how video call rooms work — every consultation gets a unique room ID.

---

#### `layout.tsx` — The Root Shell

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>      ← TanStack Query (data fetching)
          <AuthProvider>     ← JWT expiry check
            <SocketProvider>  ← SignalR connections
              <ThemeProvider> ← Dark/light mode
                {children}   ← The actual page
              </ThemeProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

**This is the outermost wrapper for every page.** Every URL in the application is rendered inside this layout. The providers are nested in a deliberate order:

1. `QueryProvider` — outermost because everything might need data fetching
2. `AuthProvider` — needs Query client to refetch token
3. `SocketProvider` — needs auth state to know whether to connect
4. `ThemeProvider` — innermost, applies theme class to DOM

---

### `src/providers/` — React Providers

**Purpose:** Providers are components that make global services or state available to every child component without "prop drilling" (passing data through 10 layers of components).

**Real-world analogy:** A provider is like electricity in an office building. You don't carry your own generator to every room. You plug in anywhere and get power. Providers work the same way — they supply global capabilities to any component that wants them.

#### `QueryProvider`

```tsx
// Creates a single TanStack Query client shared across the app
// defaultOptions: staleTime 60s (don't refetch if data is less than 1 min old)
//                retry: 1 (retry failed requests once before showing error)
```

**Why it exists:** Without this, every component that fetches data would maintain its own loading/error/data state. With React Query, fetching, caching, background refresh, and error handling are automated.

#### `AuthProvider`

```tsx
// Runs on app startup
// Checks: is the stored JWT token still valid?
// If expired → clears auth store → user is redirected to login
```

**Why it exists:** The JWT token is stored in localStorage (via Zustand persist). When a user comes back the next day, the old token might be expired. This provider catches that and cleans up before any API calls fail.

#### `SocketProvider`

```tsx
// Runs after login (when isAuthenticated = true)
// Creates SignalR connections lazily (only in browser, inside useEffect)
// Starts consultation and notification hub connections
// Stops connections on logout
```

**Why lazy initialization was critical:** SignalR's `HubConnectionBuilder.build()` internally calls `require()` (CommonJS dynamic require). When Next.js pre-renders pages on the server, it evaluates all imported modules. If `signalr-client.ts` instantiated connections at module load time (top-level const), the server would call `require()` during prerender and crash with `"dynamic usage of require is not supported"`. 

**The fix:** Convert module-level singleton exports to lazy getter functions:
```typescript
// BEFORE (broken — runs at import time = server crash)
export const consultationHubConnection = buildConnection(url);

// AFTER (fixed — runs only when called inside useEffect = client only)
export const getConsultationHubConnection = () => {
  if (!_connection) _connection = buildConnection(url);
  return _connection;
};
```

#### `ThemeProvider`

```tsx
// Wraps next-themes' ThemeProvider
// Reads initial theme from Zustand theme.store (persisted to localStorage)
// Applies "class" strategy — adds "dark" class to <html> element
// TailwindCSS dark: variants respond to this class
```

---

### `src/store/` — Zustand State Management

**Purpose:** Global client-side state that multiple components need to share. Think of it as application-level memory.

**Real-world analogy:** Zustand stores are like a company's shared bulletin board. Any employee (component) can read what's posted and update it. Everyone sees the latest information without anyone having to carry messages around.

#### `auth.store.ts`

```typescript
// State: user, accessToken, isAuthenticated, isLoading
// Actions: setAuth(user, token), clearAuth(), setLoading(bool)
// Persistence: localStorage key "pdc-auth"
//   - Persists: user, accessToken, isAuthenticated
//   - Does NOT persist: isLoading (runtime-only)
```

**Critical detail — `partialize`:** Not all state is persisted. `isLoading` is excluded because it is a runtime flag, not something that should survive a page refresh. This is a deliberate design choice.

**Used by:**
- `AuthProvider` — to check token expiry
- `interceptors.ts` — to read `accessToken` for every API request
- Route guards — to check `isAuthenticated` and `user.role`
- `SocketProvider` — to trigger hub connections on login

#### `consultation.store.ts`

```typescript
// State: activeConsultation, isCallActive, isMicMuted, isCameraOff
// Actions: setActiveConsultation, setCallActive, toggleMic, toggleCamera, endCall
// Persistence: NONE (session-only — cleared on page refresh)
```

**Why not persisted:** Active call state does not survive a page refresh. If a user refreshes during a call, they need to rejoin the call — the backend room state handles continuity, not the frontend store.

**Used by:**
- Video call page — to render current call state
- Doctor/Patient dashboards — to show "in call" indicator

#### `theme.store.ts`

```typescript
// State: theme ('light' | 'dark' | 'system')
// Persistence: localStorage key "pdc-theme"
// Default: 'system' (respects OS preference)
```

---

### `src/services/` — HTTP and SignalR Clients

**Purpose:** The lowest-level communication layer. These files know how to talk to the backend — they don't know what data means, just how to send/receive it.

#### `api-client.ts`

```typescript
// Creates two Axios instances:
// 1. apiClient → backend (http://localhost:5000)
//    - timeout: 30 seconds
//    - auto-attaches JWT Bearer token via interceptor
//    - handles 401 by clearing auth and redirecting
//
// 2. aiApiClient → AI service (http://localhost:8000)
//    - timeout: 60 seconds (AI generation takes longer)
//    - no auth interceptor (internal service)
```

**Why two clients?** The backend and AI service are different servers, different timeouts, different authentication rules. One client cannot serve both correctly.

#### `interceptors.ts`

```typescript
// Request interceptor: reads token from auth store (non-React, store.getState())
//   → adds Authorization: Bearer <token> header to every request
//
// Response interceptor:
//   → on 401 Unauthorized: calls clearAuth() + redirects to /patient-login
//   → on any other error: re-throws (let the caller handle it)
```

**Critical pattern — `useAuthStore.getState()`:** Inside Axios interceptors, you cannot use React hooks (no component context). Zustand's `.getState()` gives access to the store outside of React components — this is one of Zustand's key advantages over Redux.

#### `signalr-client.ts`

```typescript
// Exports two lazy getter functions:
// getConsultationHubConnection() → creates/returns consultation hub singleton
// getNotificationHubConnection() → creates/returns notification hub singleton
//
// Connection config:
//   - accessTokenFactory: reads JWT from auth store for WebSocket auth
//   - withAutomaticReconnect: [0, 2000, 5000, 10000, 30000] ms retry intervals
//   - logging: Information in dev, Warning in production
```

---

### `src/config/` — Configuration

**Purpose:** Centralize all configuration values so they come from one place. Change an environment variable once — it affects everywhere.

#### `env.ts`

```typescript
// Maps NEXT_PUBLIC_* environment variables to typed config object
// Fallbacks for local development (localhost addresses)
// 
// Variables:
//   NEXT_PUBLIC_API_BASE_URL    → backend URL
//   NEXT_PUBLIC_AI_SERVICE_URL  → FastAPI URL
//   NEXT_PUBLIC_SIGNALR_HUB_URL → SignalR hub base URL
//   NEXT_PUBLIC_LIVEKIT_URL     → LiveKit server
//   NEXT_PUBLIC_APP_NAME        → Application name
```

**Why `NEXT_PUBLIC_` prefix?** Next.js only exposes environment variables to the browser if they start with `NEXT_PUBLIC_`. Variables without this prefix are server-only — never sent to clients.

#### `api.config.ts`

```typescript
// Uses env.ts values to build structured config with:
// - baseUrl, aiServiceUrl, timeout, headers
// - endpoints: organized by module (auth, patient, doctor, admin, consultation)
//   e.g., apiConfig.endpoints.auth.login → '/api/auth/login'
//
// Declared "as const" → TypeScript infers literal types (string literals, not string)
```

#### `socket.config.ts`

```typescript
// SignalR connection config:
// - consultationHub: `${signalrHubUrl}/consultation`
// - notificationHub: `${signalrHubUrl}/notification`
// - reconnectDelays: [0, 2000, 5000, 10000, 30000]
// Declared "as const" → reconnectDelays becomes readonly tuple
// (Important: spread with [...delays] when passing to withAutomaticReconnect)
```

---

### `src/guards/` — Route Protection

**Purpose:** Guards protect pages from unauthorized access. They are React components that wrap page content and redirect if the user doesn't meet the requirements.

**Real-world analogy:** Guards are like security checkpoints at a company. The lobby checkpoint (`AuthGuard`) lets anyone in who has a badge. The server room checkpoint (`AdminGuard`) only lets people with Admin badges in.

#### `AuthGuard`

```tsx
// Checks: isAuthenticated
// If NOT authenticated → redirect to /patient-login
// If authenticated → render children
// Usage: wrap any page that requires login
```

#### `DoctorGuard`

```tsx
// Checks: isAuthenticated AND user.role === 'Doctor'
// If NOT authenticated → /doctor-login
// If authenticated but wrong role → /{role}/dashboard (e.g., /patient/dashboard)
// This prevents a patient from accessing /doctor/availability
```

#### `PatientGuard`, `AdminGuard`

Same pattern as `DoctorGuard` but check for `Patient` and `Admin` roles respectively.

**Why `useEffect` for redirect?** Guards use `useEffect` for the redirect because the auth store reads from localStorage, which is only available in the browser. During SSR/pre-render, localStorage is undefined. By putting the check in `useEffect`, it only runs after hydration (when the browser has loaded).

---

### `src/modules/` — Feature Business Logic

**Purpose:** Each module contains everything related to one business domain on the frontend: API call functions, TypeScript types, React Query hooks, form schemas, and utilities. This mirrors the backend's modular structure.

**Real-world analogy:** Think of modules as departmental filing systems. The HR department (Patient module) has its own forms, its own procedures, its own records. You don't go to Finance for HR paperwork.

```
src/modules/
├── auth/
│   ├── api/       ← Functions that call POST /api/auth/login, etc.
│   ├── hooks/     ← useLogin(), useSendOtp(), etc. (React Query mutations)
│   ├── schemas/   ← Zod validation schemas for login forms
│   ├── services/  ← auth.service.ts (isTokenExpired helper)
│   ├── types/     ← AuthUser, LoginPayload, etc.
│   └── utils/     ← Role helper functions
├── patient/
│   ├── api/       ← GET /api/patient/profile, GET /api/patient/doctors
│   ├── hooks/     ← usePatientProfile(), useDoctors()
│   ├── schemas/   ← Profile update form schema
│   ├── types/     ← PatientProfile, DoctorListItem, etc.
│   └── utils/
├── doctor/        ← Same structure
├── consultation/  ← Same structure + video call hooks
└── admin/         ← Same structure + admin-specific types
```

**Why separate `api/` from `hooks/`?**
- `api/` contains pure functions: `loginUser(payload)` → calls Axios → returns data
- `hooks/` wraps those functions in React Query: `useLogin()` → returns `{ mutate, isLoading, error }`

This separation means: you can call the API function in a non-React context (like a service worker), and you can use the hook wherever you want React Query's caching and state management.

---

### `src/components/` — Reusable UI Components

**Purpose:** Pure presentational React components. They receive props, render UI, emit events. They do NOT fetch data, do NOT call APIs, do NOT manage global state.

```
src/components/
├── shared/           ← Used across all roles
│   ├── buttons/      ← PrimaryButton, IconButton, LoadingButton
│   ├── cards/        ← DoctorCard, ConsultationCard, StatCard
│   ├── dialogs/      ← ConfirmDialog, ErrorDialog
│   ├── forms/        ← InputField, SelectField, DatePicker
│   ├── loaders/      ← PageLoader, Skeleton
│   ├── navbar/       ← Topbar navigation
│   ├── sidebar/      ← Role-specific sidebar navigation
│   └── tables/       ← DataTable, PaginatedTable
├── auth/             ← LoginForm, OtpForm
├── patient/          ← PatientProfileCard, AppointmentList
├── doctor/           ← DoctorAvailabilityCalendar, PatientQueue
├── consultation/     ← VideoCallControls, ParticipantTile
└── admin/            ← DoctorApprovalTable, SystemMetrics
```

**Scalability benefit:** If you redesign the `DoctorCard` component, every page that uses it gets updated automatically. No need to change 10 different pages. This is the "write once, use everywhere" principle.

---

### `src/hooks/`, `src/utils/`, `src/types/`, `src/styles/`

#### `src/hooks/`
Global reusable hooks that don't belong to any specific module. Examples: `useDebounce()`, `useMediaQuery()`, `useLocalStorage()`.

#### `src/utils/`
Pure utility functions with no side effects. Examples: `formatDate()`, `calculateAge()`, `truncateText()`, `cn()` (classname merger for TailwindCSS + ShadCN).

#### `src/types/`
Global TypeScript type definitions shared across modules. Examples: `Pagination<T>`, `SelectOption`, `ApiError`. Module-specific types live in `modules/*/types/`.

#### `src/styles/globals.css`
TailwindCSS directives (`@tailwind base/components/utilities`) and ShadCN CSS variables (color system, border radius, etc.) for light and dark mode.

---

## 5. Backend Detailed Explanation

### Project Architecture

The backend is not a single project. It is **9 separate C# class library projects** that compile together and are referenced by one entry point (`API`). This is what "modular monolith" looks like in .NET.

```
PatientDoctorConsultation.sln
├── API                     ← Entry point (HTTP server)
├── Shared                  ← Primitives used by everyone
├── Infrastructure          ← Database, JWT, SignalR, AI, Storage
├── Modules.Auth            ← Authentication bounded context
├── Modules.Patient         ← Patient bounded context
├── Modules.Doctor          ← Doctor bounded context
├── Modules.Consultation    ← Consultation bounded context
├── Modules.Admin           ← Admin bounded context
└── Modules.Shared          ← Shared module helpers (validators, DTOs, interfaces)
```

**Dependency direction (strict rule — never reverse):**
```
API → All Modules → Infrastructure → Shared
                 ↑
          Modules.Shared
```

No module references another module. No module references API. Infrastructure only references Shared. This one-directional dependency graph is what keeps the architecture clean.

---

### `API/` — Entry Point & Composition Root

**Purpose:** The only executable project. It starts the web server, registers all services in the DI container, and configures the HTTP pipeline.

**Think of it as:** The front door of the building. It doesn't do business work itself — it just lets people in and directs them to the right department.

#### `Program.cs`

The startup file. Every line matters:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register services
builder.Services.AddControllers();           // MVC controllers
builder.Services.AddSwaggerDocumentation();  // API Explorer (dev only)
builder.Services.AddCorsPolicy(config);      // Allow frontend origin
builder.Services.AddJwtAuthentication(config); // JWT Bearer auth
builder.Services.AddApplicationServices(config); // DbContext, modules
builder.Services.AddSignalR();               // WebSocket hub infrastructure

// Bind config classes
builder.Services.Configure<JwtConfig>(config.GetSection("Jwt"));
builder.Services.Configure<LiveKitConfig>(config.GetSection("LiveKit"));

var app = builder.Build();

// Middleware pipeline (ORDER MATTERS)
app.UseMiddleware<ExceptionMiddleware>();     // 1. Catch all exceptions
app.UseMiddleware<RequestLoggingMiddleware>(); // 2. Log every request
app.UseSwaggerDocumentation();               // 3. Swagger (dev only)
app.UseHttpsRedirection();                   // 4. Force HTTPS
app.UseCors("FrontendPolicy");               // 5. CORS headers
app.UseAuthentication();                     // 6. Validate JWT
app.UseAuthorization();                      // 7. Check permissions

// Route registration
app.MapControllers();
app.MapHub<ConsultationHub>("/hubs/consultation");
app.MapHub<NotificationHub>("/hubs/notification");

app.Run();
```

**Why order of middleware matters:** ASP.NET Core middleware is a pipeline. Each piece processes the request and passes it to the next. If `UseAuthentication()` came AFTER a controller, the user's identity would never be set when the controller runs. If `UseCors()` came before the HTTPS redirect, OPTIONS preflight requests would fail. The order in `Program.cs` is precise and intentional.

---

#### `API/Config/`

These are stub files. The real config classes live in `Shared/Config/` to avoid circular dependencies.

```
API/Config/
├── JwtConfig.cs        ← Empty stub (actual: Shared/Config/JwtConfig.cs)
├── LiveKitConfig.cs    ← Empty stub (actual: Shared/Config/LiveKitConfig.cs)
├── CorsConfig.cs       ← CORS origins config
└── DatabaseConfig.cs   ← Connection string config
```

**Why are real JwtConfig and LiveKitConfig in Shared?** If `JwtConfig` lived in `API`, then `Infrastructure` (which needs JwtConfig to generate tokens) would have to reference `API`. But `API` already references `Infrastructure`. That circular dependency would prevent the project from compiling. Moving config classes to `Shared` (which everyone can reference) breaks the cycle.

---

#### `API/Extensions/`

Extension methods that organize service registration. Instead of a 200-line `Program.cs`, each concern has its own extension class.

```csharp
// AuthenticationExtensions.cs
public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration config)
{
    // Configures JwtBearer with: secret key, issuer, audience, zero clock skew
    // ValidateLifetime: true → expired tokens are rejected
    // ClockSkew: TimeSpan.Zero → no grace period after expiry
}

// CorsExtensions.cs  
// Reads allowed origins from appsettings.json ("Cors:AllowedOrigins")
// Allows credentials (required for SignalR WebSocket auth)

// SwaggerExtensions.cs
// Adds Swagger UI for API exploration during development

// ServiceExtensions.cs
// Registers DbContext with PostgreSQL connection string
// Will register module services here as they are implemented
```

---

#### `API/Middleware/`

Middleware intercepts every HTTP request before it reaches a controller.

**`ExceptionMiddleware`:**
```csharp
// Wraps entire pipeline in try-catch
// Any unhandled exception anywhere in the app:
//   → logs it (ILogger)
//   → returns HTTP 500
//   → body: BaseResponse<object>.Fail("An unexpected error occurred.")
// This means the frontend always gets a consistent JSON error format
// The user never sees a raw .NET stack trace
```

**`RequestLoggingMiddleware`:**
```csharp
// Logs: [GET] /api/patient/profile started
// Logs: [GET] /api/patient/profile completed with 200
// Used for debugging request timing and tracking API usage
```

**`JwtMiddleware`:**
```csharp
// Currently a pass-through stub
// Designed for custom token introspection or claims extraction beyond what
// the standard JwtBearer middleware provides
// Example future use: extract "consultation-specific" custom claims
```

---

#### `API/Hubs/` — SignalR Hubs

**`ConsultationHub`:**

```csharp
public class ConsultationHub : Hub
{
    // JoinRoom(roomId) → adds this connection to a SignalR group named roomId
    // LeaveRoom(roomId) → removes from group
    // SendSignal(roomId, signal) → forwards WebRTC signaling data to others in group
}
```

**Real-world analogy:** Imagine a walkie-talkie channel. `JoinRoom` = tune to channel 7. `LeaveRoom` = turn off. `SendSignal` = broadcast on channel 7. Everyone on channel 7 receives it.

This hub acts as the **WebRTC signaling server** — it exchanges SDP (Session Description Protocol) offers/answers and ICE candidates between participants to establish peer-to-peer video connections.

**`NotificationHub`:**

```csharp
[Authorize]  // ← Only authenticated users can connect
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier; // from JWT claim
        await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        // Now: server can push to Groups.Client(userId).SendAsync("NewNotification", ...)
    }
}
```

**Why `[Authorize]`?** The notification hub sends personal notifications (e.g., "Dr. Smith accepted your appointment"). These must only go to the correct user. The JWT token sent with the WebSocket connection identifies the user; ASP.NET Core validates it before allowing connection.

---

### `Shared/` — Cross-Cutting Primitives

**Purpose:** Shared contracts and primitives that every other project references. This project has no business logic — only definitions.

```
Shared/
├── Common/
│   ├── BaseEntity.cs           ← Guid Id (auto-generated)
│   ├── BaseAuditableEntity.cs  ← + CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
│   └── BaseResponse.cs         ← Standard API response wrapper
├── Config/
│   ├── JwtConfig.cs            ← JWT settings (Secret, Issuer, Audience, ExpiryMinutes)
│   └── LiveKitConfig.cs        ← LiveKit API key, secret, URL
├── Constants/                  ← String constants (role names, cache keys)
├── Enums/
│   ├── UserRole.cs             ← Admin=0, Doctor=1, Patient=2
│   ├── ConsultationStatus.cs   ← Pending, Confirmed, InProgress, Completed, Cancelled, NoShow
│   └── DoctorAvailabilityStatus.cs ← Online, Busy, Offline
├── Exceptions/                 ← Custom domain exceptions (NotFoundException, etc.)
├── Helpers/                    ← Pure static helper functions
├── Responses/                  ← Typed response models
└── Security/                   ← Password hashing helpers
```

**`BaseEntity` and `BaseAuditableEntity`:**

```
All database entities inherit from these:
BaseEntity              → gives every record a Guid primary key
BaseAuditableEntity     → additionally tracks WHO created/modified it and WHEN

User, Patient, Doctor, Consultation, etc. all extend BaseAuditableEntity
```

**`BaseResponse<T>`:**

```csharp
// Every API response wraps data in this envelope:
// { "success": true, "data": {...}, "message": null, "errors": null }
// or
// { "success": false, "data": null, "message": "Email already exists", "errors": ["..."] }
//
// Benefits:
// 1. Frontend always knows what shape to expect
// 2. Error handling is consistent
// 3. No need to check HTTP status codes for business errors (check success field)
```

---

### `Infrastructure/` — Technical Services

**Purpose:** Infrastructure is the "how" layer — how do we store data, how do we create tokens, how do we talk to AI, how do we save files. It provides technical implementations of interfaces defined elsewhere.

```
Infrastructure/
├── Persistence/
│   ├── Context/
│   │   └── ApplicationDbContext.cs   ← EF Core DbContext (auto-discovers entity configs)
│   ├── Configurations/               ← Stub files (moved to module-level)
│   ├── Migrations/                   ← EF Core migration files
│   └── Seed/                         ← Database seeder
├── Identity/
│   ├── Jwt/
│   │   └── JwtTokenGenerator.cs      ← Creates HMAC-SHA256 signed JWTs
│   └── OTP/                          ← OTP generation and email sending
├── Realtime/
│   └── LiveKit/
│       └── LiveKitService.cs         ← LiveKit room management (stubbed)
├── AI/
│   ├── BioMistral/
│   │   └── BioMistralService.cs      ← Wraps OllamaClient with clinical prompt
│   ├── Ollama/
│   │   └── OllamaClient.cs           ← HTTP client for Ollama API
│   └── PromptTemplates/
│       └── SummaryPromptTemplate.cs  ← Clinical summary prompt builder
└── Storage/
    └── Local/
        └── LocalStorageService.cs    ← File upload/delete to disk
```

---

#### `Infrastructure/Persistence/` — Database Layer

**`ApplicationDbContext`:**

```csharp
// Extends EF Core's DbContext
// OnModelCreating: scans ALL assemblies starting with "PatientDoctorConsultation"
//   → applies IEntityTypeConfiguration<T> implementations from every module
//
// This is a key architectural decision:
// Each module owns its entity configurations (Doctor module → DoctorEntityConfiguration)
// Infrastructure doesn't need to reference modules at compile time
// At runtime, all assemblies are loaded → dynamic discovery picks up all configs
```

**Why this approach?** If `ApplicationDbContext` had `DbSet<User>`, `DbSet<Doctor>`, etc. explicitly listed, it would need to import every module. That creates circular dependencies (Infrastructure → Modules → Infrastructure). The dynamic assembly scan solves this cleanly.

---

#### `Infrastructure/Identity/Jwt/JwtTokenGenerator.cs`

```csharp
// Generates signed JWT with claims:
// - sub (Subject)  → userId (Guid)
// - email          → user's email
// - role           → Admin / Doctor / Patient
// - jti            → unique token ID (prevents replay attacks)
//
// Signs with: HMAC-SHA256 + secret key from JwtConfig.Secret
// Expiry: JwtConfig.ExpiryMinutes (default 60 minutes)
```

---

#### `Infrastructure/AI/` — AI Integration

Three layers are deliberately separated:

1. **`PromptTemplates/`** — Pure string builders. Know nothing about HTTP or models.
2. **`Ollama/OllamaClient.cs`** — Pure HTTP client. Calls `/api/generate`. Knows nothing about BioMistral specifically.
3. **`BioMistral/BioMistralService.cs`** — Orchestrates: builds prompt → calls OllamaClient with model name "biomistral" → returns result.

**Why this layering?** If you replace BioMistral with GPT-4 or Llama-3 tomorrow, you only change `BioMistralService.cs`. The prompt template and HTTP client don't change. If Ollama's API changes, you only change `OllamaClient.cs`. Each layer has one reason to change.

---

#### `Infrastructure/Storage/LocalStorageService.cs`

```csharp
// Saves uploaded files to wwwroot/uploads/{folder}/
// Uses Guid prefix on filename to prevent naming conflicts and path traversal
// Returns public URL (e.g., /uploads/avatars/abc123_photo.jpg)
//
// Security: Path.GetFileName() strips directory traversal (../../etc/passwd)
// Security: Guid prefix prevents filename collision and enumeration
```

---

### `Modules/` — Domain Modules

Each module is a self-contained business domain. They all follow the same internal structure:

```
Modules/{ModuleName}/
├── Controllers/    ← HTTP endpoint handlers
├── Services/       ← Business logic implementation
├── Interfaces/     ← Service contracts (IAuthService, IPatientService)
├── DTOs/           ← Data Transfer Objects (request/response shapes)
├── Models/         ← Domain entities (database tables)
├── Validators/     ← FluentValidation rules
├── Mappings/       ← AutoMapper profiles (Model → DTO)
├── Configurations/ ← EF Core entity configurations (Auth + Consultation only)
└── SDD/            ← Spec Driven Development documentation
    ├── README.md   ← Module purpose and bounded context
    ├── APIs.md     ← All endpoints for this module
    ├── Database.md ← Database tables this module owns
    └── Flow.md     ← Step-by-step execution flows
```

---

#### Auth Module

**Responsibility:** Identity and access management for all three user roles.

**Models:**
```csharp
User : BaseAuditableEntity
{
    Email, PasswordHash, Role (UserRole enum),
    IsActive, IsVerified,
    OtpCode, OtpExpiresAt,        ← OTP-based 2FA
    RefreshToken, RefreshTokenExpiresAt  ← Token refresh
}
```

**DTOs:**
```csharp
// Requests
LoginRequest(Email, Password, Role)
SendOtpRequest(Email)
VerifyOtpRequest(Email, Otp)

// Responses
AuthTokenResponse(AccessToken, RefreshToken, ExpiresAt, Role, UserId)
OtpResponse(Message, ExpiresAt)
```

**Validators (FluentValidation):**
```csharp
LoginRequestValidator:
    Email → NotEmpty, valid email format
    Password → NotEmpty, min 6 chars
    Role → NotEmpty

VerifyOtpRequestValidator:
    Email → NotEmpty, valid email
    Otp → NotEmpty, exactly 6 characters
```

**Interface:**
```csharp
IAuthService:
    Task<string> LoginAsync(email, password, cancellationToken)
    Task<bool> VerifyOtpAsync(email, otp, cancellationToken)
    Task SendOtpAsync(email, cancellationToken)
```

**Controller:**
```csharp
[Route("api/auth")]
AuthController:
    POST api/auth/login         ← Email+password → JWT
    POST api/auth/send-otp      ← Send 6-digit OTP to email
    POST api/auth/verify-otp    ← Verify OTP → returns JWT
```

**Mapping:**
```csharp
AuthMappingProfile:
    User → AuthTokenResponse (maps Id → UserId, Role.ToString() → Role)
    AccessToken and RefreshToken fields are populated manually in service (not from User entity)
```

---

#### Patient Module

**Model:**
```csharp
Patient : BaseAuditableEntity
{
    UserId (FK → Auth.User),
    FullName, PhoneNumber, DateOfBirth, Gender, BloodGroup, AvatarUrl
}
```

**Endpoints (planned):**
- `GET /api/patient/profile` — fetch own profile
- `PUT /api/patient/profile` — update profile
- `GET /api/patient/doctors` — browse available doctors
- `GET /api/patient/consultations` — view consultation history

---

#### Doctor Module

**Model:**
```csharp
Doctor : BaseAuditableEntity
{
    UserId (FK → Auth.User),
    FullName, Specialization, PhoneNumber, Bio, AvatarUrl,
    ConsultationFee (decimal),
    AvailabilityStatus (DoctorAvailabilityStatus enum),  ← Online/Busy/Offline
    IsVerifiedByAdmin (bool)  ← Admin must approve before doctor goes live
}
```

**Key business rule:** `IsVerifiedByAdmin = false` by default. A newly registered doctor cannot accept consultations until an admin verifies them. This mirrors real healthcare platform requirements (credential verification).

---

#### Consultation Module

**Model:**
```csharp
Consultation : BaseAuditableEntity
{
    PatientId, DoctorId,
    ScheduledAt (DateTime),
    Status (ConsultationStatus enum),  ← Pending → Confirmed → InProgress → Completed
    RoomId (string?),                  ← LiveKit room identifier
    Symptoms, Notes,                   ← Clinical data
    AiSummary (string?),               ← Generated by BioMistral after call ends
    StartedAt, EndedAt                 ← For duration tracking and billing
}
```

**This is the central domain entity.** It links Patient ↔ Doctor, tracks the entire lifecycle of a consultation, stores the video room reference, clinical notes, and the AI-generated summary.

---

#### Admin Module

**Responsibilities:**
- Verify (approve/reject) doctor registrations
- View system-wide consultation statistics
- Manage user accounts
- Monitor platform health

**Note:** Admin module has no domain-specific `Model` entity because admins operate on data owned by other modules (they approve `Doctor` entities, view all `Consultation` records).

---

#### `Modules/Shared/` (Modules.Shared project)

**Purpose:** Shared helpers, interfaces, and validators that are common across modules but not low-level enough for the main `Shared/` project.

```
Modules.Shared/
├── DTOs/        ← Pagination<T>, common request wrappers
├── Helpers/     ← Module-level helper functions
├── Interfaces/  ← ICurrentUserService, IPaginationService
└── Validators/  ← Common validation rules (phone number, date range)
```

---

## 6. Database Flow

### How Data Gets to PostgreSQL

```
HTTP Request arrives
     ↓
Controller receives DTO (e.g., LoginRequest)
     ↓
FluentValidation validates DTO fields
     ↓
Service method called (AuthService.LoginAsync)
     ↓
Service uses ApplicationDbContext (injected via DI)
     ↓
EF Core LINQ query:
    var user = await _context.Set<User>()
                             .FirstOrDefaultAsync(u => u.Email == email);
     ↓
EF Core translates LINQ to SQL:
    SELECT * FROM "Users" WHERE "Email" = 'patient@example.com' LIMIT 1
     ↓
Npgsql driver sends SQL to PostgreSQL
     ↓
PostgreSQL returns row
     ↓
EF Core maps row to User entity object
     ↓
Service uses entity, applies business logic
     ↓
AutoMapper maps entity → response DTO
     ↓
Controller returns BaseResponse<AuthTokenResponse>
```

### EF Core Entity Configuration

Each module owns the configuration for its entities via `IEntityTypeConfiguration<T>`:

```csharp
// Modules.Auth/Configurations/UserEntityConfiguration.cs
public class UserEntityConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(u => u.Email).IsUnique();
        // ... column mappings, constraints
    }
}
```

`ApplicationDbContext.OnModelCreating()` discovers this automatically via assembly scanning. **No central registration needed.**

### Migrations

```bash
# Create a migration when models change
dotnet ef migrations add AddConsultationRoomId --project Infrastructure --startup-project API

# Apply to database
dotnet ef database update --startup-project API
```

Migrations live in `Infrastructure/Persistence/Migrations/` — they are the version history of your database schema.

### Where Validation Happens (and why)

```
Layer               Validates What
─────────────────────────────────────────────────
FluentValidation    Input format (email format, min length, required fields)
Service Layer       Business rules (doctor exists, user has permission, time slot available)
EF Core             Database constraints (unique email, foreign key integrity)
PostgreSQL          Final data integrity (NOT NULL, CHECK constraints)
```

**Why multiple layers?** Defense in depth. If FluentValidation is bypassed somehow (direct HTTP call), the service layer catches business violations. If the service has a bug, the database constraint is the last line of defense.

---

## 7. Authentication Flow

### Step-by-Step: Patient Login with OTP

```
Step 1: Patient submits email + password on /patient-login
──────────────────────────────────────────────────────────
Frontend:
  - LoginForm validates: email format, password min length (Zod schema)
  - Calls: POST /api/auth/login { email, password, role: "Patient" }

Backend:
  - ExceptionMiddleware → RequestLoggingMiddleware → Controller
  - FluentValidation: LoginRequestValidator checks email + password + role
  - AuthService.LoginAsync():
      1. Query User by email
      2. Verify BCrypt password hash
      3. Check IsActive = true
      4. Check Role matches requested role
      5. JwtTokenGenerator.GenerateToken(userId, email, role)
      6. Return AuthTokenResponse { accessToken, refreshToken, expiresAt, role, userId }

Frontend:
  - Receives token
  - auth.store.setAuth(user, token) → persists to localStorage "pdc-auth"
  - Router pushes to /patient/dashboard
```

```
Step 2 (Alternative): OTP-based login
──────────────────────────────────────
POST /api/auth/send-otp { email }
  → Backend generates 6-digit OTP
  → Stores OTP hash + expiry in User.OtpCode, User.OtpExpiresAt
  → Sends OTP via email (SMTP)
  → Returns OtpResponse { message, expiresAt }

POST /api/auth/verify-otp { email, otp }
  → Backend looks up user by email
  → Validates OTP matches stored hash AND not expired
  → Sets User.IsVerified = true
  → Generates JWT and returns AuthTokenResponse
```

```
Step 3: Token is used for every subsequent API call
─────────────────────────────────────────────────────
Axios interceptor (interceptors.ts):
  - Reads token: useAuthStore.getState().accessToken
  - Sets: Authorization: Bearer eyJhbGci...

Backend validates JWT:
  - Signature: HMAC-SHA256 with configured secret key
  - Issuer: must match Jwt:Issuer in appsettings
  - Audience: must match Jwt:Audience
  - Expiry: token must not be expired (zero clock skew)
  - Result: HttpContext.User.Claims populated with userId, email, role
```

```
Step 4: Frontend token expiry check
──────────────────────────────────────
AuthProvider (runs on every page load):
  - authService.isTokenExpired() decodes JWT payload
  - Checks: Date.now() >= payload.exp * 1000
  - If expired → clearAuth() → Zustand clears store → localStorage cleared
  - AuthGuard detects isAuthenticated = false → redirects to /patient-login
```

---

## 8. Realtime Flow

### SignalR Architecture

```
Server                                    Client (Browser)
──────                                    ────────────────
ConsultationHub ─── WebSocket ──────────► socket-provider.tsx
NotificationHub ─── WebSocket ──────────► socket-provider.tsx
```

SignalR uses WebSocket as the transport (with long-polling fallback). The connection is persistent — unlike HTTP, it stays open and allows both client and server to send messages at any time.

### How the Connection Lifecycle Works

```
1. App loads → RootLayout renders SocketProvider
2. SocketProvider: isAuthenticated = false → no connection yet
3. User logs in → auth.store.setAuth(user, token) → isAuthenticated = true
4. SocketProvider's useEffect re-runs (isAuthenticated changed)
5. getConsultationHubConnection() called for FIRST TIME
   → creates HubConnection with accessTokenFactory
6. consultationHub.start() → WebSocket handshake with backend
   → JWT token sent in handshake headers
   → Server validates token
   → Connection established
7. NotificationHub connects → user added to personal group (userId)
8. User logs out → clearAuth() → SocketProvider cleanup runs
   → consultationHub.stop()
   → notificationHub.stop()
```

### SSR Issue and Fix (Important Lesson)

**The Problem:** Next.js runs code on the server to generate initial HTML (prerendering). Even `'use client'` components get rendered once server-side for the initial HTML shell. During this server-side execution, the JavaScript module evaluation chain ran `buildConnection()` at module load time, which internally called `require()` — a CommonJS feature that Turbopack's SSR bundle does not support.

**Error seen:**
```
Error: dynamic usage of require is not supported
at requireStub ...
at new HubConnectionBuilder...
```

**Root cause:** Top-level `const consultationHubConnection = buildConnection(url)` executes when the module is first imported — before any component renders, before any `useEffect` runs, before the browser even exists.

**The Fix:** Lazy singleton pattern.

```typescript
// BROKEN — runs at import time (server crash)
export const consultationHubConnection = buildConnection(socketConfig.consultationHub);

// FIXED — runs only when first called (inside useEffect = browser only)
let _consultationHubConnection: signalR.HubConnection | null = null;
export const getConsultationHubConnection = () => {
  if (!_consultationHubConnection)
    _consultationHubConnection = buildConnection(socketConfig.consultationHub);
  return _consultationHubConnection;
};
```

`useEffect` only runs in the browser, never on the server. By moving connection creation inside `useEffect` (indirectly, via the getter), `HubConnectionBuilder` is only ever instantiated in a browser environment where `require()` is supported.

### Realtime Events

```
Event                       Direction           Handler
─────────────────────────────────────────────────────────
ConsultationStatusChanged   Server → Patient    Update booking status in UI
IncomingCall               Server → Doctor     Show incoming call modal
CallEnded                  Server → Both       End video call, trigger AI summary
NewNotification            Server → User       Show toast notification
WebRtcOffer                Peer → Peer         WebRTC signaling (via ConsultationHub)
WebRtcAnswer               Peer → Peer         WebRTC signaling
WebRtcIceCandidate         Peer → Peer         NAT traversal
```

---

## 9. Video Consultation Flow

### Current State

The video call route exists (`/consultation/video-call/[roomId]/page.tsx`) and renders a placeholder. The backend `LiveKitService` and `ConsultationHub` are scaffolded but not yet implemented.

### Planned Architecture

```
Step 1: Doctor or Patient clicks "Start Call"
  → Frontend calls: GET /api/consultation/{id}/room
  → Backend: LiveKitService.CreateRoomAsync(roomId)
     → HTTP POST to LiveKit server → creates room
  → Backend: LiveKitService.GenerateAccessToken(roomId, userId, userName)
     → Creates LiveKit JWT (separate from app JWT)
  → Returns: { roomId, accessToken }

Step 2: Frontend receives LiveKit token
  → Navigates to /consultation/video-call/{roomId}
  → VideoCallPage renders LiveKit React components:
     <LiveKitRoom serverUrl={liveKitUrl} token={accessToken}>
       <VideoConference />
     </LiveKitRoom>
  → LiveKit handles: WebRTC negotiation, media tracks, recording

Step 3: During call
  → ConsultationHub.JoinRoom(roomId) — both participants join SignalR group
  → Additional WebRTC signaling fallback through SignalR if needed
  → Backend updates Consultation.Status = InProgress, Consultation.StartedAt

Step 4: Call ends
  → LiveKit "room ended" event
  → Frontend calls: PATCH /api/consultation/{id}/end
  → Backend: Consultation.Status = Completed, Consultation.EndedAt set
  → Backend: BioMistralService.SummarizeConsultationAsync(transcript)
  → Consultation.AiSummary saved to database
  → SignalR broadcasts: CallEnded event to both participants
```

### Frontend/Backend Responsibility Split

| Responsibility | Owner |
|---|---|
| Video media encoding | LiveKit SDK (client) |
| Room token generation | Backend (LiveKitService) |
| WebRTC offer/answer signaling | LiveKit (primary), ConsultationHub (fallback) |
| Call state UI (mute, camera) | consultation.store.ts |
| AI summary generation | Backend → AI Service |
| Billing calculation | Backend (StartedAt/EndedAt diff) |

---

## 10. AI Service Flow

### Three-Layer AI Architecture

```
Frontend (optional direct call)
    ↓
Backend Consultation Module
    ↓  uses
Infrastructure/AI/BioMistral/BioMistralService
    ↓  calls
Infrastructure/AI/Ollama/OllamaClient
    ↓  HTTP POST
Ollama process (port 11434)
    ↓  runs model
BioMistral 7B (medical language model)
    ↓
Clinical summary text
```

### FastAPI (ai-services/) vs Backend AI Layer

There are **two** AI integration paths:

| Path | Used for | Tech |
|---|---|---|
| `Infrastructure/AI/OllamaClient.cs` | Server-side summary generation (triggered by backend after call ends) | C# HttpClient → Ollama |
| `ai-services/` FastAPI | Alternative HTTP API for AI (can be called by frontend directly or as standalone service) | Python FastAPI → Ollama |

Both ultimately talk to the same Ollama process running BioMistral. The FastAPI layer adds a Python HTTP service on port 8000 that frontend can also directly call via `aiApiClient` in `api-client.ts`.

### BioMistral Model

BioMistral is a medical language model fine-tuned for clinical text. The prompt template in `SummaryPromptTemplate.cs` instructs it to extract:
- Chief complaint
- Key symptoms
- Diagnosis/assessment
- Recommended treatment or follow-up

This makes summaries medically structured rather than general-purpose.

---

## 11. Project Execution Flow

### 1. Backend Starts (`dotnet run --project API`)

```
1. Program.cs executes
2. WebApplication.CreateBuilder reads appsettings.json + appsettings.Development.json
3. Services registered: DbContext, JWT auth, CORS, SignalR, AutoMapper, FluentValidation
4. Configuration bound: JwtConfig, LiveKitConfig
5. app.Build() creates the WebApplication
6. Middleware pipeline configured (order matters)
7. Controllers discovered via reflection (all assemblies with [ApiController])
8. SignalR hubs mapped to WebSocket routes
9. app.Run() → Kestrel listens on port 5000
10. Swagger available at: http://localhost:5000/swagger
```

### 2. Frontend Starts (`npm run dev`)

```
1. Next.js + Turbopack starts
2. TypeScript compiled incrementally
3. Route manifest built (all page.tsx files discovered)
4. Dev server starts on port 3000
5. Hot Module Replacement (HMR) enabled
6. App available at: http://localhost:3000
```

### 3. User Opens App

```
Browser requests http://localhost:3000/
     ↓
Next.js renders RootLayout
     ↓
Providers initialize: QueryClient, AuthProvider, SocketProvider, ThemeProvider
     ↓
AuthProvider useEffect: checks token expiry → no stored token → skip
     ↓
SocketProvider useEffect: isAuthenticated = false → no connection
     ↓
page.tsx renders home page with login links
```

### 4. User Logs In

```
User navigates to /patient-login
     ↓
PatientLoginPage renders LoginForm component
     ↓
User types email + password → submits
     ↓
Zod schema validates form (client-side, instant)
     ↓
useLogin() hook mutation fires
     ↓
Axios: POST http://localhost:5000/api/auth/login
     ↓
Backend pipeline:
  ExceptionMiddleware → RequestLoggingMiddleware → CORS → Authentication → Controller
     ↓
FluentValidation: LoginRequestValidator
     ↓
AuthService.LoginAsync: query user, verify password, generate JWT
     ↓
200 OK: { success: true, data: { accessToken, refreshToken, role, userId } }
     ↓
Frontend interceptor: no Authorization header needed (this IS the login request)
     ↓
useLogin onSuccess: auth.store.setAuth(user, token)
     ↓
Zustand persists to localStorage "pdc-auth"
     ↓
Router.push('/patient/dashboard')
     ↓
SocketProvider useEffect fires (isAuthenticated changed to true)
     ↓
getConsultationHubConnection() → creates and starts WebSocket connection
```

### 5. API Request Happens

```
Patient clicks "Browse Doctors"
     ↓
usePatientDoctors() hook fires
     ↓
React Query: is data cached and fresh? (staleTime: 60s)
  YES → return cached data (no HTTP call)
  NO  → proceed
     ↓
apiClient.get('/api/patient/doctors')
     ↓
Request interceptor: Authorization: Bearer eyJhbGci...
     ↓
Backend: authenticate → authorize (Patient role required) → DoctorController.GetDoctors()
     ↓
EF Core query: SELECT * FROM "Doctors" WHERE "IsVerifiedByAdmin" = true
     ↓
AutoMapper: List<Doctor> → List<DoctorListItemDto>
     ↓
BaseResponse<List<DoctorListItemDto>> returned
     ↓
React Query caches result, marks as fresh
     ↓
Component re-renders with doctor list
```

### 6. SignalR Connects

```
consultationHub.start() called (inside SocketProvider useEffect)
     ↓
SignalR negotiates transport (WebSocket preferred, long-polling fallback)
     ↓
WebSocket handshake: GET /hubs/consultation
  Headers: Authorization: Bearer <token> (from accessTokenFactory)
     ↓
NotificationHub.OnConnectedAsync():
  userId extracted from JWT claim
  Groups.AddToGroupAsync(connectionId, userId)
     ↓
Connection established — bidirectional channel open
     ↓
Server can now push to specific user:
  await _hubContext.Clients.Group(userId).SendAsync("NewNotification", payload)
```

### 7. DB Query Runs

```
Service calls: _context.Set<Consultation>()
                        .Where(c => c.PatientId == patientId && c.Status == Confirmed)
                        .Include(c => c.Doctor)
                        .OrderBy(c => c.ScheduledAt)
                        .ToListAsync()
     ↓
EF Core translates LINQ to SQL:
  SELECT c.*, d.* FROM "Consultations" c
  JOIN "Doctors" d ON c."DoctorId" = d."Id"
  WHERE c."PatientId" = @patientId
    AND c."Status" = 1
  ORDER BY c."ScheduledAt"
     ↓
Npgsql connection pool gets a connection
     ↓
SQL sent to PostgreSQL
     ↓
PostgreSQL executes, returns rows
     ↓
Npgsql maps rows to C# objects
     ↓
EF Core materializes: List<Consultation> with Doctor navigation property loaded
     ↓
Service applies business logic
     ↓
AutoMapper: List<Consultation> → List<ConsultationDto>
```

### 8. Video Call Starts

```
Patient confirms appointment → calls POST /api/consultation
  → Consultation created with Status = Pending
     ↓
Doctor receives notification via NotificationHub: "IncomingCall"
  → Doctor's frontend shows call modal
     ↓
Doctor accepts → PATCH /api/consultation/{id}/confirm
  → Status = Confirmed
  → SignalR → Patient gets ConsultationStatusChanged event
     ↓
Patient clicks "Join Call" → GET /api/consultation/{id}/room
  → Backend creates LiveKit room (future)
  → Returns LiveKit access token
     ↓
Patient navigates to /consultation/video-call/{roomId}
Doctor navigates to /consultation/video-call/{roomId}
     ↓
Both join ConsultationHub group: JoinRoom(roomId)
     ↓
LiveKit room renders video streams
     ↓
Call in progress → Status = InProgress
```

---

## 12. Why This Architecture Is Good

### Scalability

| Concern | How Addressed |
|---|---|
| Traffic grows | Stateless backend → add more instances behind load balancer |
| Module gets heavy | Extract it to microservice (boundaries already defined) |
| AI gets slow | Scale AI service independently (already separate process) |
| Database bottleneck | Add read replicas (EF Core supports multiple connection strings) |

### Maintainability

```
Problem: Bug in doctor availability feature
Old way: Search entire codebase for anything related to availability
This project: Open Modules/Doctor/ → everything related to doctors is here
```

Each module is self-contained. A new developer can understand the entire Doctor module without reading any other module's code.

### Separation of Concerns

```
Layer               Knows About             Does NOT Know About
──────────────────────────────────────────────────────────────
Controller          HTTP, DTOs              Business rules, database
Service             Business rules          HTTP, database details
Repository          Database queries        Business rules, HTTP
Infrastructure      Technical details       Business domains
Shared              Common primitives       Anything else
```

### Enterprise Readiness

- JWT with role-based authorization
- Global exception handling with consistent error format
- Request logging middleware
- FluentValidation on every input
- Audit trail on every entity (CreatedAt, UpdatedAt, CreatedBy)
- CORS policy for specific origins
- Swagger API documentation

### Future Microservice Migration

```
Today:
  API.csproj references Modules.Doctor.csproj
  → compiled together, single deployment

Future (if Doctor module needs independent scaling):
  1. Copy Modules.Doctor/ into a new solution
  2. Add its own API project
  3. Point its own DbContext to a separate database (or same schema)
  4. Replace direct DI call with HTTP client or gRPC
  5. Main API calls Doctor Service via HTTP instead of direct DI
```

Because modules don't reference each other's code, step 4 is the only non-trivial change.

---

## 13. Current Project Status

### What Is Complete (Scaffolded and Compiling)

| Component | Status |
|---|---|
| All 9 backend projects | ✅ Created, compiling, zero errors |
| Solution file (.slnx) | ✅ All 9 projects registered |
| Program.cs pipeline | ✅ Full middleware, hubs, extensions |
| Shared primitives | ✅ BaseEntity, BaseResponse, enums, configs |
| JWT generation | ✅ Fully implemented |
| Authentication middleware | ✅ Fully configured |
| SignalR hubs | ✅ ConsultationHub (room join/signal), NotificationHub (auth + groups) |
| Middleware | ✅ Exception, Logging (RequestLogging) |
| Entity models | ✅ User, Patient, Doctor, Consultation |
| DTOs | ✅ All Auth DTOs (request + response) |
| Validators | ✅ All Auth validators |
| AutoMapper profiles | ✅ Auth, Patient, Doctor, Consultation |
| EF Core context | ✅ Dynamic assembly discovery |
| AI layer (backend) | ✅ OllamaClient, BioMistralService, prompt template |
| Local storage service | ✅ Implemented |
| LiveKit service | ⚠️ Stubbed (NotImplementedException) |
| Next.js frontend | ✅ All 17 routes, builds clean |
| TypeScript config | ✅ Strict mode, path aliases |
| TailwindCSS + ShadCN | ✅ Full theme variables |
| Zustand stores | ✅ Auth, consultation, theme |
| Axios + interceptors | ✅ Auth + 401 handling |
| SignalR client | ✅ Lazy initialization, SSR-safe |
| Route guards | ✅ Auth, Patient, Doctor, Admin |
| Providers | ✅ All 4 providers |
| FastAPI AI service | ✅ Running, health + summary routes |

### What Is Placeholder

| Component | Status | Notes |
|---|---|---|
| AuthService implementation | ⚠️ Stub | throws NotImplementedException |
| PatientService, DoctorService, etc. | ⚠️ Stub | throws NotImplementedException |
| All controllers business logic | ⚠️ Returns Ok() only | No DTO binding yet |
| LiveKit room creation | ⚠️ Stub | Needs LiveKit .NET SDK |
| EF Core migrations | ⚠️ None yet | Run after DB config |
| Frontend module APIs | ⚠️ Scaffold | Function signatures defined, bodies pending |
| Video call UI | ⚠️ Placeholder | LiveKit React components need integration |

### Warnings That Are OK

```
CS9113 (5 warnings) — "Parameter is unread"
  Location: Stub service constructors
  e.g., LiveKitService has (HttpClient httpClient) that is not yet used
  
  These are INTENTIONAL. The constructor parameters define the DI contracts.
  When implementation is added, these parameters WILL be used.
  Do NOT remove these constructor injections.
```

### Development Phases

```
Phase 1 (Current)  → Architecture scaffolding ✅
Phase 2 (Next)     → Auth implementation (login, OTP, JWT)
Phase 3            → Patient + Doctor module implementation
Phase 4            → Consultation booking workflow
Phase 5            → Video call + LiveKit integration
Phase 6            → AI summary generation integration
Phase 7            → Admin management features
Phase 8            → Testing (unit + integration)
Phase 9            → Production deployment
```

---

## 14. Learning Explanation (Beginner-Friendly)

### What Is a Modular Monolith?

**Simple version:** One application, but with well-organized departments that don't talk to each other directly.

**Real-world:** A hospital has different departments — Emergency, Cardiology, Pediatrics. They all share the same building, the same patient records system (database), and the same management (API). But each department has its own doctors, procedures, and filing cabinets (module code). A cardiologist doesn't randomly access the pediatrics files.

**Technical version:** Multiple C# projects in one solution that compile together and deploy as one executable. Boundaries enforced by project references — if Module A doesn't reference Module B, Module A literally cannot use Module B's code.

---

### What Is SDD (Spec Driven Development)?

**Simple version:** Write the plan before writing the code.

**Real-world:** Before building a house, an architect draws blueprints. The builders follow the blueprints exactly. Spec Driven Development = writing blueprints (specs) for software before coding it.

**In this project:** Every module has a `/SDD/` folder with documentation that specifies exactly what APIs exist, what the database looks like, and how requests flow — before any line of implementation code is written. This prevents scope creep and keeps all team members aligned.

---

### What Are Providers?

**Simple version:** Providers wrap your entire application and make services available to every component inside them, without passing those services through props.

**Real-world:** Wi-Fi in an office. You don't carry a cable to every desk. The router (provider) covers the whole office. Any device inside the office (any component inside the provider) can connect.

---

### What Are Stores (Zustand)?

**Simple version:** Global variables that React components can read and write, and when they change, all components that use them automatically re-render.

**Real-world:** A company's internal status board. Any employee can update it. Any employee watching it sees the update immediately.

---

### What Are DTOs?

**DTO = Data Transfer Object.** It is a class that defines exactly the shape of data that crosses a boundary (between HTTP request and service, or between service and database).

**Why not use the domain model directly?**
- A `User` entity has a `PasswordHash` field. You NEVER want to send that to the frontend.
- The `LoginRequest` DTO contains only `Email`, `Password`, and `Role` — exactly what the login API needs, nothing more, nothing less.

---

### What Is Middleware?

**Simple version:** Code that runs for every HTTP request before it reaches the controller.

**Real-world:** Airport security. Every passenger (request) goes through security (middleware) before reaching their gate (controller). Some passengers get stopped at security — middleware can short-circuit the pipeline.

---

### What Are Validators (FluentValidation)?

**Simple version:** Rules that check if incoming data is correct before your business logic runs.

```csharp
// Without validator: service gets called with garbage data
// With validator: data is checked BEFORE service is called
RuleFor(x => x.Email).NotEmpty().EmailAddress();  // Must be non-empty valid email
RuleFor(x => x.Password).MinimumLength(6);        // Password at least 6 chars
```

If validation fails, a 400 Bad Request is automatically returned with error details. The service never runs.

---

### What Are Mappings (AutoMapper)?

**Simple version:** Automatic copying of data from one object type to another.

```csharp
// WITHOUT AutoMapper (manual, tedious):
var dto = new PatientDto {
    FullName = patient.FullName,
    Email = patient.Email,
    // ... copy 15 more fields
};

// WITH AutoMapper (automatic):
var dto = _mapper.Map<PatientDto>(patient);
```

AutoMapper profiles define the mapping rules once. After that, `Map<Destination>(source)` handles the copying automatically, even for nested objects.

---

### What Is Dependency Injection?

**Simple version:** Instead of a class creating its own dependencies (`new AuthService()`), the framework creates them and passes them in.

```csharp
// WITHOUT DI (tightly coupled):
public class AuthController {
    private AuthService _service = new AuthService(new UserRepository(new DbContext(...)));
    // You have to know how to construct everything manually
}

// WITH DI (loosely coupled):
public class AuthController(IAuthService authService) {
    // ASP.NET Core automatically creates and injects the right implementation
    // You only know about the INTERFACE, not the concrete class
}
```

Benefits:
- Easy testing (inject a mock instead of real service)
- Easy to swap implementations (change the registration, not the consumer)
- Lifetimes managed automatically (Singleton, Scoped, Transient)

---

### What Does EF Core Do?

**Simple version:** It lets you write C# code to query a database, instead of writing SQL manually.

```csharp
// Instead of writing SQL:
// SELECT * FROM "Doctors" WHERE "IsVerifiedByAdmin" = true

// You write C# LINQ:
var doctors = await _context.Set<Doctor>()
                            .Where(d => d.IsVerifiedByAdmin)
                            .ToListAsync();

// EF Core translates LINQ → SQL → sends to PostgreSQL
```

---

### What Does SignalR Do?

**Simple version:** It lets the server send messages to the browser without the browser asking first.

**Real-world:** Normal HTTP is like mailing a letter (client sends, server replies). SignalR is like a phone call — both sides can speak at any time.

**In PDC:** When a doctor accepts an appointment, the server immediately notifies the patient's browser via SignalR — without the patient refreshing the page.

---

## 15. Best Practices

### How to Add a New Feature Correctly

**Example: Add "Doctor Reviews" feature**

```
Step 1: Write the SDD spec
  → Create Modules/Doctor/SDD/Reviews.md
  → Define: API endpoints, database table, request/response shapes, flow

Step 2: Add the domain model
  → Create Modules/Doctor/Models/DoctorReview.cs
  → Extend BaseAuditableEntity
  → Add IEntityTypeConfiguration<DoctorReview> in Modules/Doctor/Configurations/

Step 3: Add DTOs
  → Modules/Doctor/DTOs/ReviewRequest.cs (CreateReviewRequest, etc.)
  → Modules/Doctor/DTOs/ReviewResponse.cs (ReviewDto)

Step 4: Add validators
  → Modules/Doctor/Validators/ReviewValidators.cs
  → FluentValidation rules for CreateReviewRequest

Step 5: Define interface
  → Modules/Doctor/Interfaces/IDoctorReviewService.cs
  → public interface IDoctorReviewService { Task<ReviewDto> CreateReviewAsync(...); }

Step 6: Implement service
  → Modules/Doctor/Services/DoctorReviewService.cs
  → Implements IDoctorReviewService

Step 7: Add AutoMapper profile
  → Modules/Doctor/Mappings/ReviewMappingProfile.cs
  → CreateMap<DoctorReview, ReviewDto>()

Step 8: Add controller
  → Modules/Doctor/Controllers/DoctorReviewController.cs
  → Inject IDoctorReviewService

Step 9: Register service in DI
  → API/Extensions/ServiceExtensions.cs
  → services.AddScoped<IDoctorReviewService, DoctorReviewService>()

Step 10: Create EF migration
  → dotnet ef migrations add AddDoctorReviews --project Infrastructure --startup-project API

Step 11: Frontend
  → Add types to frontend/src/modules/doctor/types/
  → Add API call to frontend/src/modules/doctor/api/
  → Add React Query hook to frontend/src/modules/doctor/hooks/
  → Add UI component to frontend/src/components/doctor/
  → Add to appropriate dashboard page
```

---

### How to Maintain Architecture Consistency

1. **Never put business logic in a Controller.** Controllers only: receive request, call service, return response. One to three lines of logic maximum.

2. **Never let modules reference each other.** If Doctor module needs Patient data, it should be passed as a parameter from the service layer — or read from the shared database with the patient's ID.

3. **Always use interfaces.** Controllers receive `IAuthService`, not `AuthService`. This enables testing and future swap-out.

4. **Always wrap responses in `BaseResponse<T>`.** Never return raw objects from controllers.

5. **Always add FluentValidation for new DTOs.** Never trust that the frontend sent valid data.

6. **Always inherit from `BaseAuditableEntity` for new domain entities.** Every record needs an audit trail.

7. **Write SDD docs first.** Before implementing any feature, write the spec in the module's `/SDD/` folder.

---

### How to Avoid Tight Coupling

```
WRONG: Service creates its own dependencies
  public class AuthService {
      private readonly AppDbContext _context = new AppDbContext(...); // NEVER do this
  }

RIGHT: Service receives dependencies via constructor (DI)
  public class AuthService(ApplicationDbContext context, IJwtTokenGenerator jwt)
  {
      // ASP.NET Core injects these — loose coupling
  }

WRONG: Module A imports Module B directly
  using PatientDoctorConsultation.Modules.Doctor; // in Auth module — WRONG

RIGHT: Pass data via shared contracts (DTOs, Shared enums)
  The Auth module never imports Doctor. If doctor data is needed,
  it is passed as a parameter via shared contracts.
```

---

### How to Use Git Branches

```
main          → Production-ready code only. Never commit directly.
develop       → Integration branch. All feature branches merge here.
feature/*     → One branch per feature (feature/doctor-reviews, feature/video-call)
bugfix/*      → One branch per bug fix
hotfix/*      → Emergency fix for production issue (branches from main)

Workflow:
  git checkout -b feature/consultation-booking develop
  ... implement feature ...
  git push origin feature/consultation-booking
  → Create Pull Request to develop
  → Code review → merge
  → When develop is stable → merge to main
```

---

### How to Avoid Breaking Architecture

1. **Run `dotnet build` after every backend change.** Zero warnings policy — CS9113 is acceptable for stubs but new warnings should be addressed.

2. **Run `npm run build` after every frontend change.** TypeScript type check catches mistakes that runtime wouldn't catch until production.

3. **Never delete constructor parameters from stub services.** They define DI contracts. Removing them breaks registration.

4. **Always use `-LiteralPath` in PowerShell when paths contain `[` or `]`.** PowerShell treats square brackets as wildcard patterns with `-Path`. This caused the `[roomId]/page.tsx` to remain empty silently.

5. **Never add `'use server'` to files that use browser APIs.** Never call `window`, `localStorage`, or `document` outside `useEffect` or browser-only guards.

6. **Keep the middleware pipeline order in `Program.cs` fixed.** Changing the order of `UseAuthentication()` / `UseAuthorization()` / `UseCors()` will break auth and CORS silently.

---

## 16. Complete Folder Tree

```
PateintDoctorConsultaion/
│
├── frontend/
│   ├── public/
│   │   ├── avatars/              ← User avatar images
│   │   ├── icons/                ← App icons (favicon, etc.)
│   │   └── images/               ← Static images
│   ├── src/
│   │   ├── app/                  ← Next.js App Router (URL = folder structure)
│   │   │   ├── layout.tsx        ← Root layout (wraps all pages with providers)
│   │   │   ├── page.tsx          ← Home page → /
│   │   │   ├── (auth)/           ← Route group: auth pages (no URL prefix)
│   │   │   │   ├── patient-login/page.tsx    → /patient-login
│   │   │   │   ├── doctor-login/page.tsx     → /doctor-login
│   │   │   │   ├── admin-login/page.tsx      → /admin-login
│   │   │   │   └── otp-verification/page.tsx → /otp-verification
│   │   │   ├── (dashboard)/      ← Route group: protected dashboard pages
│   │   │   │   ├── patient/
│   │   │   │   │   ├── dashboard/page.tsx    → /patient/dashboard
│   │   │   │   │   ├── doctors/page.tsx      → /patient/doctors
│   │   │   │   │   ├── profile/page.tsx      → /patient/profile
│   │   │   │   │   └── consultation-history/page.tsx
│   │   │   │   ├── doctor/
│   │   │   │   │   ├── dashboard/page.tsx    → /doctor/dashboard
│   │   │   │   │   ├── consultations/page.tsx
│   │   │   │   │   ├── availability/page.tsx
│   │   │   │   │   └── profile/page.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── dashboard/page.tsx    → /admin/dashboard
│   │   │   │       ├── doctors/page.tsx
│   │   │   │       └── consultations/page.tsx
│   │   │   └── consultation/
│   │   │       └── video-call/[roomId]/page.tsx  → /consultation/video-call/:id
│   │   │
│   │   ├── components/           ← Reusable UI components (no API calls)
│   │   │   ├── shared/
│   │   │   │   ├── buttons/
│   │   │   │   ├── cards/
│   │   │   │   ├── dialogs/
│   │   │   │   ├── forms/
│   │   │   │   ├── loaders/
│   │   │   │   ├── navbar/
│   │   │   │   ├── sidebar/
│   │   │   │   └── tables/
│   │   │   ├── auth/
│   │   │   ├── patient/
│   │   │   ├── doctor/
│   │   │   ├── consultation/
│   │   │   └── admin/
│   │   │
│   │   ├── modules/              ← Feature business logic (API, hooks, types per domain)
│   │   │   ├── auth/
│   │   │   │   ├── api/          ← Axios call functions
│   │   │   │   ├── hooks/        ← React Query hooks (useLogin, useSendOtp)
│   │   │   │   ├── schemas/      ← Zod form validation schemas
│   │   │   │   ├── services/     ← auth.service.ts (isTokenExpired)
│   │   │   │   ├── types/        ← AuthUser, LoginPayload
│   │   │   │   └── utils/
│   │   │   ├── patient/          ← Same structure
│   │   │   ├── doctor/           ← Same structure
│   │   │   ├── consultation/     ← Same structure + video call hooks
│   │   │   └── admin/            ← Same structure
│   │   │
│   │   ├── providers/            ← React Context wrappers
│   │   │   ├── auth-provider.tsx    ← Token expiry check on startup
│   │   │   ├── query-provider.tsx   ← TanStack React Query client
│   │   │   ├── socket-provider.tsx  ← SignalR connection lifecycle
│   │   │   └── theme-provider.tsx   ← Dark/light mode (next-themes)
│   │   │
│   │   ├── guards/               ← Route protection components
│   │   │   ├── auth.guard.tsx       ← Requires: isAuthenticated
│   │   │   ├── patient.guard.tsx    ← Requires: role = Patient
│   │   │   ├── doctor.guard.tsx     ← Requires: role = Doctor
│   │   │   └── admin.guard.tsx      ← Requires: role = Admin
│   │   │
│   │   ├── store/                ← Zustand global state
│   │   │   ├── auth.store.ts        ← user, accessToken, isAuthenticated (persisted)
│   │   │   ├── consultation.store.ts ← activeConsultation, call controls (session-only)
│   │   │   └── theme.store.ts       ← theme preference (persisted)
│   │   │
│   │   ├── services/             ← HTTP + WebSocket clients
│   │   │   ├── api-client.ts        ← Axios instances (backend + AI service)
│   │   │   ├── interceptors.ts      ← JWT attach + 401 redirect
│   │   │   └── signalr-client.ts    ← Lazy SignalR hub getters
│   │   │
│   │   ├── config/               ← Environment + connection config
│   │   │   ├── env.ts               ← NEXT_PUBLIC_* env var mapping
│   │   │   ├── api.config.ts        ← API base URL, endpoints, timeout
│   │   │   └── socket.config.ts     ← Hub URLs, reconnect delays
│   │   │
│   │   ├── hooks/                ← Global reusable hooks (useDebounce, etc.)
│   │   ├── utils/                ← Pure utility functions (formatDate, cn)
│   │   ├── types/                ← Global TypeScript types (Pagination<T>)
│   │   └── styles/
│   │       └── globals.css          ← TailwindCSS directives + ShadCN variables
│   │
│   ├── next.config.js            ← Next.js: reactStrictMode, images, security headers
│   ├── tailwind.config.ts        ← TailwindCSS: ShadCN theme, darkMode class strategy
│   ├── tsconfig.json             ← TypeScript: strict, bundler resolution, @/* alias
│   └── package.json              ← Dependencies (Next.js, React Query, Zustand, etc.)
│
├── backend/
│   └── PatientDoctorConsultation/
│       ├── PatientDoctorConsultation.slnx   ← Solution: all 9 projects
│       │
│       ├── API/                             ← Entry point (HTTP server, port 5000)
│       │   ├── Program.cs                   ← Middleware pipeline + service registration
│       │   ├── appsettings.json             ← Jwt, ConnectionStrings, Cors, LiveKit config
│       │   ├── appsettings.Development.json ← Dev overrides
│       │   ├── Config/
│       │   │   ├── JwtConfig.cs             ← Stub (real: Shared/Config/JwtConfig.cs)
│       │   │   ├── LiveKitConfig.cs         ← Stub
│       │   │   ├── CorsConfig.cs
│       │   │   └── DatabaseConfig.cs
│       │   ├── Controllers/                 ← (module controllers registered via reflection)
│       │   ├── Extensions/
│       │   │   ├── AuthenticationExtensions.cs   ← AddJwtAuthentication
│       │   │   ├── CorsExtensions.cs             ← AddCorsPolicy (FrontendPolicy)
│       │   │   ├── ServiceExtensions.cs          ← AddApplicationServices (DbContext)
│       │   │   └── SwaggerExtensions.cs          ← AddSwaggerDocumentation
│       │   ├── Hubs/
│       │   │   ├── ConsultationHub.cs       ← JoinRoom, LeaveRoom, SendSignal (WebRTC)
│       │   │   └── NotificationHub.cs       ← [Authorize] personal notification groups
│       │   └── Middleware/
│       │       ├── ExceptionMiddleware.cs   ← Global try-catch → BaseResponse.Fail
│       │       ├── JwtMiddleware.cs         ← Custom token introspection hook (stub)
│       │       └── RequestLoggingMiddleware.cs ← Log method/path/statusCode
│       │
│       ├── Shared/                          ← Cross-cutting primitives (no business logic)
│       │   ├── Common/
│       │   │   ├── BaseEntity.cs            ← Guid Id
│       │   │   ├── BaseAuditableEntity.cs   ← + CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
│       │   │   └── BaseResponse.cs          ← API response envelope {success, data, message, errors}
│       │   ├── Config/
│       │   │   ├── JwtConfig.cs             ← Secret, Issuer, Audience, ExpiryMinutes
│       │   │   └── LiveKitConfig.cs         ← ApiKey, ApiSecret, ServerUrl
│       │   ├── Constants/                   ← Role name strings, cache keys
│       │   ├── Enums/
│       │   │   ├── UserRole.cs              ← Admin=0, Doctor=1, Patient=2
│       │   │   ├── ConsultationStatus.cs    ← Pending→Confirmed→InProgress→Completed
│       │   │   └── DoctorAvailabilityStatus.cs ← Online, Busy, Offline
│       │   ├── Exceptions/                  ← NotFoundException, ValidationException
│       │   ├── Helpers/                     ← Static pure helper methods
│       │   ├── Responses/                   ← Typed response wrappers
│       │   └── Security/                    ← Password hashing (BCrypt wrappers)
│       │
│       ├── Infrastructure/                  ← Technical implementations
│       │   ├── Persistence/
│       │   │   ├── Context/
│       │   │   │   └── ApplicationDbContext.cs  ← EF Core DbContext, dynamic assembly scan
│       │   │   ├── Configurations/          ← Stub files (configs moved to module level)
│       │   │   ├── Migrations/              ← EF Core migration history
│       │   │   └── Seed/                    ← Database seeder
│       │   ├── Identity/
│       │   │   ├── Jwt/
│       │   │   │   └── JwtTokenGenerator.cs ← HMAC-SHA256 JWT generation with claims
│       │   │   └── OTP/                     ← 6-digit OTP generation + email dispatch
│       │   ├── Realtime/
│       │   │   └── LiveKit/
│       │   │       └── LiveKitService.cs    ← ILiveKitService (stub: NotImplementedException)
│       │   ├── AI/
│       │   │   ├── BioMistral/
│       │   │   │   └── BioMistralService.cs ← SummarizeConsultationAsync via OllamaClient
│       │   │   ├── Ollama/
│       │   │   │   └── OllamaClient.cs      ← HTTP POST to Ollama /api/generate
│       │   │   └── PromptTemplates/
│       │   │       └── SummaryPromptTemplate.cs ← Clinical summary prompt builder
│       │   └── Storage/
│       │       └── Local/
│       │           └── LocalStorageService.cs ← File upload/delete to wwwroot/uploads/
│       │
│       ├── Modules/
│       │   ├── Auth/                        ← Authentication bounded context
│       │   │   ├── Controllers/AuthController.cs      ← /api/auth/{login,send-otp,verify-otp}
│       │   │   ├── Services/AuthService.cs            ← IAuthService implementation (stub)
│       │   │   ├── Interfaces/IAuthService.cs         ← LoginAsync, VerifyOtpAsync, SendOtpAsync
│       │   │   ├── DTOs/AuthRequest.cs                ← LoginRequest, SendOtpRequest, VerifyOtpRequest
│       │   │   ├── DTOs/AuthResponse.cs               ← AuthTokenResponse, OtpResponse
│       │   │   ├── Models/User.cs                     ← Email, PasswordHash, Role, OTP fields
│       │   │   ├── Validators/AuthValidators.cs        ← LoginRequestValidator, OTP validators
│       │   │   ├── Mappings/AuthMappingProfile.cs     ← User → AuthTokenResponse
│       │   │   ├── Configurations/UserEntityConfiguration.cs ← EF Core table mapping
│       │   │   └── SDD/
│       │   │       ├── README.md   ← Module purpose + bounded context
│       │   │       ├── APIs.md     ← All endpoints spec
│       │   │       ├── Database.md ← Users table spec
│       │   │       └── Flow.md     ← Login/OTP flow spec
│       │   │
│       │   ├── Patient/                     ← Patient bounded context
│       │   │   ├── Controllers/PatientController.cs
│       │   │   ├── Services/PatientService.cs
│       │   │   ├── Interfaces/IPatientService.cs
│       │   │   ├── DTOs/                    ← PatientRequest, PatientResponse
│       │   │   ├── Models/Patient.cs        ← UserId, FullName, DOB, Gender, BloodGroup
│       │   │   ├── Validators/
│       │   │   ├── Mappings/PatientMappingProfile.cs
│       │   │   └── SDD/
│       │   │
│       │   ├── Doctor/                      ← Doctor bounded context
│       │   │   ├── Controllers/DoctorController.cs
│       │   │   ├── Services/DoctorService.cs
│       │   │   ├── Interfaces/IDoctorService.cs
│       │   │   ├── DTOs/
│       │   │   ├── Models/Doctor.cs         ← Specialization, ConsultationFee, IsVerifiedByAdmin
│       │   │   ├── Validators/
│       │   │   ├── Mappings/DoctorMappingProfile.cs
│       │   │   └── SDD/
│       │   │
│       │   ├── Consultation/                ← Consultation bounded context
│       │   │   ├── Controllers/ConsultationController.cs
│       │   │   ├── Services/ConsultationService.cs
│       │   │   ├── Interfaces/IConsultationService.cs
│       │   │   ├── DTOs/
│       │   │   ├── Models/Consultation.cs   ← PatientId, DoctorId, Status, RoomId, AiSummary
│       │   │   ├── Validators/
│       │   │   ├── Mappings/ConsultationMappingProfile.cs
│       │   │   ├── Configurations/ConsultationEntityConfiguration.cs
│       │   │   └── SDD/
│       │   │
│       │   ├── Admin/                       ← Admin bounded context
│       │   │   ├── Controllers/AdminController.cs
│       │   │   ├── Services/AdminService.cs
│       │   │   ├── Interfaces/IAdminService.cs
│       │   │   ├── DTOs/
│       │   │   ├── Validators/
│       │   │   ├── Mappings/
│       │   │   └── SDD/
│       │   │
│       │   └── Shared/                      ← Cross-module shared helpers
│       │       ├── DTOs/                    ← Pagination<T>, common wrappers
│       │       ├── Helpers/                 ← Module-level helpers
│       │       ├── Interfaces/              ← ICurrentUserService
│       │       └── Validators/              ← Common validation rules
│       │
│       └── Tests/
│           ├── UnitTests/                   ← Service-level unit tests (xUnit/NUnit)
│           └── IntegrationTests/            ← API-level integration tests
│
├── ai-services/
│   ├── app/
│   │   ├── main.py                ← FastAPI app, router registration
│   │   ├── routes/
│   │   │   ├── health.py          ← GET /health → { status: "ok" }
│   │   │   └── summary.py         ← POST /ai/summary → clinical summary
│   │   ├── services/
│   │   │   └── summary_service.py ← generate_summary(transcript) → calls Ollama
│   │   ├── models/                ← Pydantic model definitions
│   │   ├── prompts/               ← Prompt template strings
│   │   └── utils/                 ← Utility helpers
│   ├── requirements.txt           ← fastapi, uvicorn, httpx, pydantic
│   └── .env                       ← OLLAMA_BASE_URL, BIOMISTRAL_MODEL
│
├── docs/
│   ├── Architecture.md            ← High-level system overview
│   ├── APIContracts.md            ← All REST endpoint contracts
│   ├── ERDiagram.md               ← Database entity relationship diagram
│   ├── SDDGuide.md                ← How to use SDD on this project
│   ├── SetupGuide.md              ← Local development setup steps
│   └── folderstructure.md         ← This file (complete architecture guide)
│
└── scripts/
    ├── setup.ps1                  ← One-command dev environment bootstrap
    └── seed.sql                   ← Initial development data seed
```

---

> **Last Updated:** May 2026
>
> **Architecture Status:** Scaffolding complete, implementation in progress.
>
> **Next Step for any developer:** Read `docs/SDDGuide.md` → Pick a module → Open its `/SDD/` folder → Implement the spec.
