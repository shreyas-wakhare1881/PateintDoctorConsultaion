# Spec Driven Development (SDD) Guide

## What is SDD?
Every backend domain module must be specced before implementation.
Each module ships with four mandatory markdown documents inside its `SDD/` folder.

## Required SDD Files per Module

| File         | Purpose                                         |
|--------------|-------------------------------------------------|
| README.md    | Module overview, bounded context, dependencies  |
| APIs.md      | All HTTP endpoint contracts (request/response)  |
| Database.md  | Table schemas with column types and constraints |
| Flow.md      | Step-by-step business flow diagrams             |

## SDD Workflow
1. Create SDD docs BEFORE writing any code.
2. Get SDD docs reviewed.
3. Implement Controllers, Services, DTOs matching the spec exactly.
4. Update SDD docs if requirements change — never let them drift.

## Module Structure (per domain)
```
Modules/{ModuleName}/
+-- SDD/
¦   +-- README.md
¦   +-- APIs.md
¦   +-- Database.md
¦   +-- Flow.md
+-- Controllers/
+-- Services/
+-- Interfaces/
+-- DTOs/
+-- Models/
+-- Validators/
+-- Mappings/
```
