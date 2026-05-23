# Architecture Overview

## Style: Modular Monolith + SDD (Spec Driven Development)

```
PateintDoctorConsultaion/
+-- frontend/         Next.js 14 App Router + Zustand + TailwindCSS + ShadCN
+-- backend/          ASP.NET Core 10 Modular Monolith
¦   +-- API/          Entry point — middleware, extensions, hubs, config
¦   +-- Shared/       Cross-cutting — BaseEntity, Enums, Exceptions, Helpers
¦   +-- Infrastructure/ Persistence (EF Core/PG), Identity (JWT/OTP), Realtime (SignalR/LiveKit), AI, Storage
¦   +-- Modules/      Domain modules: Auth | Patient | Doctor | Consultation | Admin
+-- ai-services/      FastAPI + Ollama + BioMistral
+-- docs/
+-- scripts/
```

## Key Principles
- **Feature isolation** — each domain module is self-contained (Controllers, Services, Interfaces, DTOs, Models, Validators, Mappings)
- **SDD compliance** — every module ships with SDD/README.md, APIs.md, Database.md, Flow.md
- **Infrastructure separation** — no business logic inside Infrastructure layer
- **Realtime** — SignalR hubs wired at API entry point; LiveKit handles WebRTC media
- **AI integration** — BioMistral via Ollama called from dedicated FastAPI micro-service
