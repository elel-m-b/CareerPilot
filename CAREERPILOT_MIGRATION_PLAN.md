# CareerPilot Migration Plan

**Upgrading CareerPilot (Java / Spring Boot / Angular) to feature parity with `career-compass` while keeping Java as the core backend language.**

| Field | Value |
| --- | --- |
| Document type | Planning only — no code, config or history changes |
| Author role | Senior software architect / Java backend engineer |
| Target repository | `CareerPilot` (this repository) |
| Reference repository | `career-compass` (read-only source of truth for the target functionality) |
| Date | 2026-10-14 |
| Status | Proposed, awaiting human review |

> **How to read this document.** Every statement is tagged:
> **[fact]** = verified by inspecting the code in one of the two repositories;
> **[rec]** = a recommendation from this plan, not present in the code yet.
> Where a fact is cited, the file path is given so the next agent can re-verify it.

---

## Table of contents

1. [Executive Summary](#1-executive-summary)
2. [Current State of Both Projects](#2-current-state-of-both-projects)
3. [Complete Feature Comparison](#3-complete-feature-comparison)
4. [Target Java-Based Architecture](#4-target-java-based-architecture)
5. [Technology and Dependency Recommendations](#5-technology-and-dependency-recommendations)
6. [Migration Phases and Detailed Implementation Steps](#6-migration-phases-and-detailed-implementation-steps)
7. [Ordered Git Commit Plan](#7-ordered-git-commit-plan)
8. [Testing and Acceptance Criteria](#8-testing-and-acceptance-criteria)
9. [Risks and Mitigation Strategies](#9-risks-and-mitigation-strategies)
10. [Final Definition of Done](#10-final-definition-of-done)

---

## 1. Executive Summary

**[fact]** `CareerPilot` is a working, Java-based product: a Spring Boot 3.3.5 / Java 21 REST backend (Maven, `com.resumeanalyzer` package root) with a JWT-secured API, a deterministic 7-dimension ATS scoring engine, PDF/DOCX parsing (Apache PDFBox + Apache POI), JPA/Hibernate persistence with Flyway migrations (H2 dev / MySQL prod), and an Angular 18 SPA. Its README calls the product **"ATSense: Resume Analyzer"**.

**[fact]** `career-compass` is a more advanced, non-Java prototype built on **Vite + React 19 + TypeScript + Convex**. Beyond a richer CV scan (10 weighted dimensions, issue severity/explanation/recommendation, keyword relevance, CV versioning) it adds an entire career toolkit: a candidate profile, a companies/jobs catalog with a deterministic job-matching engine, application tracking, a CV editor with an ATS template and PDF export, a job-description generator, an interview-preparation planner with a question bank, a RAG-based learning roadmap, and a RAG-based AI Career Copilot with cited, grounded answers.

**[rec]** The migration is best executed as **feature modules added to the existing Spring Boot application**, not a rewrite. CareerPilot's existing ATS checker, auth, entities, controllers, and Angular shell are preserved and extended. The porting order is deliberately risk-first: port the *deterministic, testable* engines (taxonomy → parser → 10-dimension ATS engine → matching → planners) before the *AI-dependent* layers (job-description generation, learning roadmap, copilot), because the deterministic engines are pure functions with no external service dependency and can be verified with unit tests exactly as `career-compass` does.

**[rec]** Two capabilities are *not* ported mechanically and must be re-architected:

1. **Authentication** — `career-compass` uses Convex Auth (email OTP + guest). CareerPilot already has a JWT + password model. The plan **keeps JWT** and treats guest/OTP as optional later work (P2). No auth rewrite on the critical path.
2. **AI + vector search** — `career-compass` calls a VLY/OpenAI-compatible gateway and stores embeddings inline in Convex with in-process ranking. CareerPilot has **no real AI integration** (its `OpenAIAnalysisService` is a no-op stub) and uses MySQL/H2. The plan introduces a **provider abstraction with deterministic offline fallbacks** (local hashing embedder, template generators) so the AI features work end-to-end without a key, mirroring `career-compass`'s own fallback design.

**Priorities.** P0 = parity for the core CV scan + versioning + a real test harness. P1 = profile, catalog/matching, application tracking, CV editor. P2 = AI job-description generator, interview prep, learning roadmap, AI copilot.

**Definition of success.** After the final verification phase, `mvn -f backend/pom.xml clean verify` and `npm --prefix frontend test` are green, every P0/P1 feature is reachable from the Angular app, the existing `/api/auth/*`, `/api/resumes/*`, `/api/analyses/*` contracts still behave, and every AI-dependent feature degrades to a labelled deterministic result when no API key is configured.

---

## 2. Current State of Both Projects

### 2.1 CareerPilot (target)

**Verified stack** — `CareerPilot/backend/pom.xml`, `CareerPilot/frontend/package.json`:

| Layer | Technology | Evidence |
| --- | --- | --- |
| Backend language | Java 21 | `pom.xml` `<java.version>21</java.version>` |
| Backend framework | Spring Boot 3.3.5 (web, data-jpa, security, validation) | `pom.xml` |
| Build tool | Maven | `pom.xml`, `Makefile` |
| Security | Spring Security 6 + JJWT 0.12.6, BCrypt | `security/`, `pom.xml` |
| Persistence | Spring Data JPA / Hibernate; H2 (dev), MySQL (prod) | `application-dev.yml`, `application-prod.yml` |
| Schema migration | Flyway (`V1__initial_schema.sql`) | `resources/db/migration/` |
| PDF parsing | Apache PDFBox 3.0.3 | `PdfResumeParser`, `pom.xml` |
| DOCX parsing | Apache POI 5.3.0 | `DocxResumeParser`, `pom.xml` |
| Boilerplate | Lombok | `pom.xml` |
| Frontend | Angular 18 (standalone components), RxJS, SCSS | `frontend/package.json`, `app.routes.ts` |

**Verified backend layout** — `CareerPilot/backend/src/main/java/com/resumeanalyzer/`:

- `analyser/DeterministicAnalyzer.java` — the scoring engine.
- `parser/` — `ResumeParserService`, `PdfResumeParser`, `DocxResumeParser`, `ParsedResume`.
- `controller/` — `AuthController`, `ResumeController`, `AnalysisController`, `DashboardController`, `UserController`.
- `service/` + `service/impl/` — `AuthService`, `ResumeService`, `AnalysisService`, `DashboardService`, `UserService`.
- `service/ai/` — `AIAnalysisService` (interface) + `OpenAIAnalysisService` (stub).
- `entity/` — `User`, `Resume`, `ResumeAnalysis`, `ResumeSection`, `Recommendation`.
- `repository/`, `dto/`, `security/`, `config/SecurityConfig.java`, `exception/`.

**Verified ATS engine** — `analyser/DeterministicAnalyzer.java`. Seven dimensions, hard-coded weights summing to 100:

| Dimension | Weight | Signal |
| --- | --- | --- |
| ATS compatibility | 20% | email, phone, location, standard headings |
| Content quality | 20% | word count, action verbs, metrics |
| Skills | 15% | number of recognised skills |
| Experience | 20% | experience section + verbs + metrics |
| Education | 10% | education section + degree keywords |
| Projects | 10% | projects section + links |
| Structure | 5% | ≥4 sections, email+phone |

`overallScore = round(Σ score×weight)`; output is a `ResumeAnalysis` with seven int score columns plus `ResumeSection` rows (`sectionType`, `score`, `feedback`) and `Recommendation` rows (`category`, `priority` ∈ {Critical, Important, Suggested}, `message`).

**Verified parser** — `parser/ResumeParserService.java`. Regex extraction of email, phone, location, action verbs, quantifiable metrics and a fixed ~45-entry skill list; keyword-based section detection (`SUMMARY`, `EXPERIENCE`, `EDUCATION`, `SKILLS`, `PROJECTS`, `CERTIFICATIONS`, `LANGUAGES`); naive section-content slicing. **PDF and DOCX only** (no TXT).

**Verified persistence** — `V1__initial_schema.sql`. Tables `users`, `resumes`, `resume_analyses`, `resume_sections`, `recommendations`. A resume is a **single row per upload** — there is **no versioning, no `isCurrent`, no `targetRole`/`jobDescription`/`careerStage`, and no stored structured parse** ([fact]).

**Verified AI integration** — `service/ai/OpenAIAnalysisService.java` logs and **returns the deterministic result unchanged**; there is no HTTP call, no embeddings, no provider client ([fact]).

**Verified frontend routes** — `frontend/src/app/app.routes.ts`: `login`, `register`, `dashboard`, `my-resumes`, `my-resumes/:id`, `analysis`, `analysis/:id`, `recommendations`, `profile`, `settings`, `**`. No jobs, companies, applications, interview prep, roadmap, copilot or CV editor ([fact]).

**Verified test coverage** — only two backend tests exist: `service/AuthServiceTest.java` and `controller/AuthControllerTest.java`. There are **no tests for the parser, the analyzer, the services beyond auth, or the controllers beyond auth** ([fact]).

**Verified security posture (notable)** — `config/SecurityConfig.java` sets `allowedOriginPatterns("*")` **together with** `allowCredentials(true)`; the JWT secret has a hard-coded development default in `application.yml` ([fact]). Both are flagged as risks in §9.

### 2.2 career-compass (reference)

**Verified stack** — `career-compass/package.json`, `README.md`, `docs/ARCHITECTURE.md`:

- Vite + React 19 + TypeScript (strict), React Router 7, Tailwind v4, shadcn/ui (Radix), Framer Motion.
- **Convex** as database + file storage + server functions; **Convex Auth** (email OTP + guest).
- `pdfjs-dist` + `fflate` for *browser-side* text extraction; Vitest for tests.
- AI via an OpenAI-compatible gateway (`VLY_INTEGRATION_KEY`), called server-side only.

**Verified feature domains and source files** — `career-compass/src/convex/`:

| Domain | Key files |
| --- | --- |
| ATS scan / analysis | `resumes.ts`, `lib/atsEngine.ts`, `lib/resumeParser.ts`, `lib/taxonomy.ts`, `lib/parsingEngines.ts` |
| Recommendations (persistent, per-finding) | `recommendations.ts`, `lib/recommendations.ts` |
| CV editor + ATS template + PDF | `cvEditor.ts`, `lib/cvImprover.ts`, `lib/cv/atsTemplate.ts` (frontend), `lib/cv/pdf.ts` (frontend) |
| Candidate profile | `profiles.ts`, `lib/career.ts` |
| Companies / jobs catalog | `catalog.ts`, `lib/jobCatalog.ts` |
| Job matching engine | `lib/jobMatcher.ts` |
| Application tracking | `applications.ts` |
| Job-description generator | `jobDescriptions.ts`, `jobDescriptionsActions.ts`, `lib/jobDescription/*` |
| Interview preparation | `interview.ts`, `lib/interviewPlanner.ts`, `lib/questionBank.ts` |
| Learning roadmap (RAG) | `rag.ts`, `ragActions.ts`, `lib/rag/*` |
| AI Career Copilot (RAG chat) | `careerCopilot.ts`, `careerCopilotActions.ts`, `lib/copilot/*` |
| Dashboard / readiness | `overview.ts`, `lib/career.ts` |
| Account / settings | `account.ts` |

**Verified target ATS engine** — `lib/atsEngine.ts`. Ten weighted dimensions summing to 100: structure 16, keywords 14, skills 14, experience 10, contact 10, formatting 8, education 8, projects 8, readability 6, impact 6. Each deduction emits an `AtsIssue` with `severity` ∈ {critical, warning, info}, an explanation and a recommendation; the engine also emits `highlights`, ordered `nextSteps`, and a `keywords` block with three modes (`job_description`, `target_role`, `general`). Grades: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 55, E below.

**Verified taxonomy** — `lib/taxonomy.ts`: ~150 canonical skills with aliases and categories; role profiles (`backend`, `frontend`, `fullstack`, `mobile`, `data`, `ml`, `qa`, `cyber`, `design`, `product`, `support`) each with `core`/`nice` keyword lists; heading and stopword dictionaries.

**Verified schema** — `career-compass/src/convex/schema.ts`. Tables: `users` (Convex Auth), `resumes` (versioned: `version`, `isCurrent`, `careerStage`, `targetRole`, `jobDescription`, `parsed`, `wordCount`, denormalised `score`/`grade`), `resumeAnalyses`, `resumeDrafts`, `profiles`, `companies`, `jobs`, `applications`, `applicationEvents`, `recommendations`, `interviewPlans`, `prepTasks`, `interviewQuestions`, `questionPractices`, `learningResources`, `resourceChunks`, `roadmaps`, `roadmapItems`, `copilotDocuments`, `copilotChunks`, `copilotConversations`, `copilotMessages`, `jobDescriptionDrafts`.

**Verified test coverage** — 17 Vitest suites (`tests/**`): `resumeParser`, `atsEngine`, `validation`, `cvEditor`, `jobDescription`, `copilot`, and nine `rag/*` suites (chunking, embedding, retrieval, prompt, roadmapSchema, skillGap, templateGenerator, providers, pipeline). The engines are pure functions, so the suites run without a database or network ([fact]).

**Verified AI design** — `docs/ai-career-copilot.md`, `docs/rag-learning-roadmap.md`. RAG with bounded retrieval, a strict grounded prompt, zod structural validation, and a **grounding step** that drops or rewrites any model-invented citation/resource; deterministic fallbacks ("labelled verbatim extract", deterministic template roadmap, local `local-hashing-v1` embedder) whenever the gateway is unavailable ([fact]).

### 2.3 Key structural differences

| Concern | CareerPilot [fact] | career-compass [fact] | Migration implication [rec] |
| --- | --- | --- | --- |
| Backend language | Java 21 / Spring Boot | TypeScript / Convex | All domain logic is **rewritten in Java**; algorithms are ported conceptually. |
| Auth | JWT + password (stateless) | Convex Auth OTP + guest | Keep JWT; do not port auth. |
| Database | JPA + Flyway (H2/MySQL) | Convex document DB | New tables via **Flyway** migrations; reuse `users`/`resumes`. |
| File storage | Stored text in DB; original file read for parsing | Convex file storage + short-lived upload URLs | **[rec]** Store extracted text in DB (already the case); original file storage is optional (P2). |
| Client-side extraction | Server-side (PDFBox/POI) | Browser (`pdfjs-dist`/`fflate`) | Keep **server-side extraction** — it is already a strength and centralises validation. |
| AI | No-op stub | Real gateway + fallbacks | **[rec]** Provider abstraction + deterministic fallbacks. |
| Tests | 2 auth tests | 17 pure-function suites | **[rec]** Port the test *intent* as JUnit tests. |

---

## 3. Complete Feature Comparison

Legend — **Reuse**: portable conceptually with adaptation. **Rewrite (Java)**: algorithm re-implemented in Java. **Architectural change**: requires new infra/design, not just a port. **Not migrated**: deliberately out of scope or incompatible.

### 3.1 Core CV scan

| Capability | career-compass [fact] | CareerPilot now [fact] | Action [rec] | Priority |
| --- | --- | --- | --- | --- |
| PDF/DOCX upload | ✅ (browser extract) | ✅ (server PDFBox/POI) | Reuse + keep server-side | P0 |
| TXT upload | ✅ | ❌ | Rewrite (trivial) | P1 |
| Structured parsing (contact/sections/entries) | ✅ full model + stats | ⚠️ regex-only, flat | Rewrite (Java) | P0 |
| Section detection incl. certs/languages/awards | ✅ | ⚠️ partial | Rewrite | P0 |
| Skill detection w/ aliases + categories | ✅ ~150 skills | ⚠️ ~45 flat list | Rewrite (port taxonomy) | P0 |
| 7-dimension score | — | ✅ | **Preserve** | — |
| 10-dimension explainable score | ✅ | ❌ | Rewrite (extend engine) | P0 |
| Severity + explanation + recommendation per finding | ✅ | ⚠️ coarse | Rewrite | P0 |
| Keyword relevance (job ad / target role / general) | ✅ | ❌ | Rewrite | P0 |
| Grade/band | ✅ | ❌ | Rewrite | P0 |
| Career-stage-aware expectations | ✅ (student/intern/graduate/early_career) | ❌ | Rewrite | P0 |
| Determinism guarantee | ✅ tested | ⚠️ mostly deterministic, untested | Add tests | P0 |
| No-fabrication guarantee | ✅ documented + tested | ⚠️ implicit | Add tests | P0 |

### 3.2 CV lifecycle

| Capability | career-compass [fact] | CareerPilot now [fact] | Action | Priority |
| --- | --- | --- | --- | --- |
| CV versioning (`version`, `isCurrent`) | ✅ | ❌ | Architectural change | P0 |
| Re-scan with new target role / job ad | ✅ | ❌ | Rewrite | P0 |
| Rename / set current / delete | ✅ | ⚠️ delete only | Rewrite | P1 |
| Score history / trend | ✅ | ⚠️ analyses list per resume | Reuse + extend | P1 |
| Latency/size: 5 MB cap | ✅ | 10 MB cap | Reconcile (keep 10 MB, document) | P1 |

### 3.3 CV improvement

| Capability | career-compass [fact] | CareerPilot now | Action | Priority |
| --- | --- | --- | --- | --- |
| Editable draft from parsed CV | ✅ | ❌ | Rewrite (Java) | P1 |
| ATS template generator (deterministic, no fabrication) | ✅ | ❌ | Rewrite (Java) | P1 |
| Filler removal + action-verb rewriting | ✅ | ❌ | Rewrite (Java) | P1 |
| Guided fixes mapping finding → editor field | ✅ | ❌ | Rewrite (Angular) | P1 |
| PDF export (text-selectable) | ✅ (hand-written PDF) | ❌ | Architectural change (PDFBox/OpenPDF) | P1 |
| Persistent per-finding recommendations w/ status | ✅ | ❌ | Architectural change | P1 |

### 3.4 Career toolkit

| Capability | career-compass [fact] | CareerPilot now | Action | Priority |
| --- | --- | --- | --- | --- |
| Candidate profile (skills, goal, work mode, links) | ✅ | ⚠️ username + theme only | Rewrite | P1 |
| Profile completeness metric | ✅ | ❌ | Rewrite | P1 |
| Career-readiness dashboard | ✅ | ⚠️ basic stats | Reuse + extend | P1 |
| Company directory | ✅ (seeded) | ❌ | Rewrite | P1 |
| Job postings | ✅ (seeded) | ❌ | Rewrite | P1 |
| Deterministic job-matching engine (5 dims) | ✅ | ❌ | Rewrite (Java) | P1 |
| Application tracking + status timeline | ✅ | ❌ | Rewrite | P1 |
| Job-description generator (AI + template) | ✅ | ❌ | Architectural change (needs AI) | P2 |
| Interview prep planner | ✅ | ❌ | Rewrite (Java) | P2 |
| Interview question bank + practice answers | ✅ | ❌ | Rewrite | P2 |
| Learning roadmap (RAG) | ✅ | ❌ | Architectural change (needs AI/vectors) | P2 |
| AI Career Copilot (RAG chat w/ citations) | ✅ | ❌ | Architectural change (needs AI/vectors) | P2 |
| Account data export / wipe | ✅ | ❌ | Rewrite | P2 |

### 3.5 Cross-cutting

| Capability | career-compass [fact] | CareerPilot now [fact] | Action | Priority |
| --- | --- | --- | --- | --- |
| Email OTP auth | ✅ | ❌ | Not migrated (keep JWT) | — |
| Guest/anonymous access | ✅ | ❌ | Optional later | P2 |
| Server-side input validation | ✅ (mirrors client) | ⚠️ partial | Harden | P0 |
| Error contract (`{code, message}`, no stack traces) | ✅ | ✅ `GlobalExceptionHandler` | Reuse | P0 |
| Per-user ownership checks | ✅ | ✅ (`findByIdAndUserId`) | Reuse | P0 |
| Prompt-injection hygiene | ✅ | n/a | Adopt with AI work | P2 |
| Observability (typed failures, error boundary) | ✅ | ⚠️ | Harden | P1 |

### 3.6 Classification summary

- **Reuse conceptually (adapt, do not copy):** scoring weights & issue taxonomy, keyword matching model, role profiles, career-stage expectations, profile completeness, career readiness, matching dimensions, interview task pools, RAG pipeline *shape* (chunk → embed → retrieve → prompt → ground → fallback), error taxonomy, test intent.
- **Rewrite in Java:** taxonomy data + loader, deterministic parser, 10-dimension ATS engine, keyword extraction, CV improver + ATS text generator, guided-fix mapping (Angular), matching engine, application state machine, interview planner, skill-gap analysis, template roadmap/job-description generators, chunking, local hashing embedder, hybrid retrieval, grounding/validation.
- **Architectural change:** CV versioning columns + `resumeDrafts`, persistent recommendations, profile table, catalog tables, application events, RAG/vector tables with async generation status, AI provider abstraction, PDF export.
- **Not migrated directly:** Convex Auth (OTP/guest), Convex file storage, browser-side extraction, the VLY SDK itself (calls are provider-agnostic in the new design), Convex-specific validation.

---

## 4. Target Java-Based Architecture

**Principle [rec]:** a **modular monolith** — one Spring Boot deployable, package-by-feature, each domain module owning its entities, repositories, services, controllers and (where relevant) engines. This keeps deployment simple (as today) while giving the codebase the same domain boundaries `career-compass` has in `src/convex/`.

### 4.1 Package layout

Keep the existing root package `com.resumeanalyzer` to avoid a churn-heavy rename on the critical path. **[rec]** An optional mechanical rename to `com.careerpilot` can be done as an isolated, no-behaviour-change commit in Phase 0; it is not required.

```
com.resumeanalyzer
├── ResumeAnalyzerApplication.java
├── config/            SecurityConfig, CorsConfig, AsyncConfig, OpenApiConfig
├── security/          JWT filter, provider, UserPrincipal, CustomUserDetailsService
├── common/            error contract (ApiError{code,message}), GlobalExceptionHandler, paging, clock
│
├── analysis/          ← existing "analyser", extended
│   ├── engine/        AtsEngine, AtsDimension, AtsIssue, KeywordAnalyzer, GradeCalculator
│   ├── TaxonomyService       (skill dictionary, role profiles, headings, stopwords)
│   ├── CareerStageRules
│   └── controller/ service/ repository/ entity/ dto/
│
├── cv/                parsing + improvement
│   ├── parser/        ResumeParserService, PdfResumeParser, DocxResumeParser, TxtResumeParser, ParsedResume
│   ├── editor/        CvImprover (buildDraftFromParsed, generateAtsText, rewriteBullet)
│   ├── template/      AtsTemplateBuilder, PdfExporter
│   └── controller/ service/ entity/ dto/
│
├── profile/           CandidateProfile entity + service/controller/dto
├── catalog/           Company, Job entities + seeded importer + search
├── matching/          JobMatcher (pure engine) + MatchController
├── application/       JobApplication, ApplicationEvent + state machine
├── interview/         InterviewPlan, PrepTask, InterviewQuestion, QuestionPractice + InterviewPlanner
├── roadmap/           SkillGapAnalyzer, LearningResource, ResourceChunk, Roadmap, RoadmapItem
│   └── rag/           Chunker, EmbeddingClient, Retrieval, RoadmapPrompt, RoadmapSchema/Grounding
├── copilot/           CopilotDocument, CopilotChunk, Conversation, Message + Retrieval + Grounding
├── ai/                ChatClient, EmbeddingClient interfaces + OpenAiCompatibleClient + LocalHashEmbedder
└── dashboard/         readiness aggregation (extends existing DashboardService)
```

### 4.2 Layering rules [rec]

- **Engines are pure.** `analysis/engine`, `matching`, `cv/editor`, `interview/InterviewPlanner`, `roadmap/rag`, `copilot/rag` contain **no Spring, no JPA, no network**. They take plain inputs and return plain objects, exactly as the JS engines do. This is what makes them unit-testable and deterministic.
- **Services orchestrate.** Services own transactions, ownership checks and persistence; they call engines and (only when configured) AI clients.
- **Controllers are thin and authenticated.** Every endpoint resolves the caller from the JWT `UserPrincipal` and scopes by user id.
- **AI is behind interfaces** with deterministic fallbacks; nothing else may depend on a concrete provider.

### 4.3 Target architecture diagram

```
                 ┌──────────────────────────────────────────────────────┐
                 │                Angular 18 SPA (CareerPilot)          │
                 │  dashboard · my-cv · cv-editor · jobs · applications │
                 │  profile · prep · roadmap · copilot · settings       │
                 └───────────────────────────┬──────────────────────────┘
                                             │ HTTP + JWT
                 ┌───────────────────────────▼──────────────────────────┐
                 │              Spring Boot 3 REST API (/api)           │
                 │  security(JWT) · error contract · validation         │
                 ├──────────────────────────────────────────────────────┤
                 │  Controllers  →  Services (tx, ownership, orchestration)
                 │                        │
                 │        ┌───────────────┴────────────────┐
                 │        │   PURE DETERMINISTIC ENGINES    │
                 │        │ AtsEngine · JobMatcher ·        │
                 │        │ CvImprover · InterviewPlanner · │
                 │        │ SkillGap · Retrieval · Grounding│
                 │        └───────────────┬────────────────┘
                 │                        │ (only if key configured)
                 │        ┌───────────────▼────────────────┐
                 │        │  AI abstraction (ai/)          │
                 │        │  ChatClient / EmbeddingClient  │
                 │        │  → OpenAI-compatible HTTP      │
                 │        │  → LocalHashEmbedder fallback  │
                 │        │  → Template fallbacks          │
                 │        └───────────────┬────────────────┘
                 └────────────────────────┼─────────────────────────────┘
                                          │ JPA / Flyway
                 ┌────────────────────────▼─────────────────────────────┐
                 │  MySQL (prod) / H2 (dev)                             │
                 │  users · resumes(+version) · resume_analyses ·       │
                 │  resume_sections · recommendations · resume_drafts · │
                 │  profiles · companies · jobs · applications ·        │
                 │  application_events · interview_* · learning_* ·     │
                 │  resource_chunks · roadmaps · roadmap_items ·        │
                 │  copilot_*                                           │
                 └──────────────────────────────────────────────────────┘
```

### 4.4 Vector storage decision [rec]

`career-compass` stores embeddings inline (`resourceChunks.embedding: number[]`) and ranks in-process, explicitly because the corpus is small and Convex has no vector index. **Mirror this in MySQL:** store each chunk's embedding as `LONGTEXT`/`BLOB` (JSON float array or a packed `float32[]`), keep a `model` column, and rank in-process over a bounded, indexed candidate set. This avoids introducing a second datastore on the critical path. A dedicated vector store (PostgreSQL + pgvector, or Qdrant) is a **P2/scaling** option to introduce only if the corpus grows into the thousands of resources — the same guidance the reference document gives.

### 4.5 Async generation decision [rec]

Convex actions are long-running by nature. In Spring, model roadmap/job-description generation as a **status machine** (`analyzed → generating → ready | failed`) persisted on the entity, with the heavy work executed on a bounded Spring `@Async` executor and a stale-run guard (mirroring `GENERATION_STALE_MS`). The client polls or re-fetches the entity. This preserves the reference UX (skeleton/retry states) without a queue infrastructure dependency.

---

## 5. Technology and Dependency Recommendations

**Rule [rec]:** add a dependency only when it removes real work and is already justified by the port. Prefer the libraries already present (PDFBox, POI, Jackson, Spring Web) over new ones.

### 5.1 Keep (no change)

| Technology | Reason |
| --- | --- |
| Spring Boot 3.3.x, Java 21, Maven | Working base; do not churn versions mid-migration. |
| Spring Security 6 + JJWT | Existing JWT auth is preserved. |
| Spring Data JPA + Hibernate + Flyway | Existing persistence; extend via migrations. |
| MySQL (prod) / H2 (dev) | No datastore change required. |
| Apache PDFBox 3, Apache POI 5 | Existing PDF/DOCX extraction; PDFBox can also *write* PDFs for the CV export. |
| Lombok, Jackson, JUnit 5, Mockito, `spring-boot-starter-test` | Present; used for the ported tests. |
| Angular 18 | Existing frontend; extend with feature modules. |

### 5.2 Add (recommended)

| Dependency | Layer | Why | Priority |
| --- | --- | --- | --- |
| `spring-boot-starter-webflux` (or JDK `java.net.http.HttpClient`) | `ai/` | Non-blocking HTTP client for the OpenAI-compatible gateway (chat + embeddings). WebClient is the Spring-idiomatic choice; JDK HttpClient avoids a new starter. **[rec]** start with JDK HttpClient + Jackson; upgrade to WebClient only if streaming is needed. | P1 |
| `org.apache.tika:tika-core` *(optional)* | `cv/parser` | Robust MIME/type sniffing to harden upload validation beyond filename extensions. | P1 |
| `networknt:json-schema-validator` *(optional)* | `roadmap`, `copilot` | JSON-schema validation of LLM output as a Java equivalent of the reference's zod step. **[rec]** Jackson + explicit validators may suffice; adopt only if schemas grow. | P2 |
| `org.springdoc:springdoc-openapi-starter-webmvc-ui` *(optional)* | API docs | The security config already permits `/swagger-ui/**` and `/v3/api-docs/**` but no dependency provides them. | P2 |

> **No new dependency** is required for: PDF export (PDFBox writes PDFs), local embeddings (plain Java hashing), cosine similarity (plain Java), chunking (plain Java), JSON grounding (Jackson).

### 5.3 Do not add

| Candidate | Why not |
| --- | --- |
| Spring AI / LangChain4j | Adds a large transitive surface; the port needs only chat + embeddings over an OpenAI-compatible endpoint. **[rec]** revisit in P2 if multiple providers are needed. |
| pgvector / Qdrant | Unnecessary at the reference corpus scale; documented as a scaling option only. |
| Kafka / RabbitMQ / Redis | The async status-machine + `@Async` executor covers the port; no queue needed for the target scale. |
| A second web framework / rewrite | Explicitly out of scope; Java/Spring Boot stays the core backend. |

### 5.4 Configuration recommendations

- **[rec]** Externalise the AI gateway settings exactly as the reference does: `ai.base-url`, `ai.chat-model`, `ai.embedding-model`, `ai.timeout-ms`, `ai.max-retries`, `ai.max-output-tokens`, `ai.temperature`, `AI_API_KEY`. All optional; absence forces deterministic fallbacks.
- **[rec]** Neutralise the hard-coded JWT default and the `*` CORS origin (see §9) before exposing the app.

---

## 6. Migration Phases and Detailed Implementation Steps

Each phase is independently mergeable and independently verifiable. **Do not start a phase until the previous phase's acceptance criteria pass.**

Priority key: **P0** essential · **P1** important · **P2** advanced.

---

### Phase 0 — Baseline, test harness, and guardrails · **P0**

**Objective.** Establish a green, verifiable baseline before adding features: backend + frontend build and test commands, a CI workflow, the shared error contract, and a first Flyway migration reserved for upcoming tables. No product behaviour changes.

**Features to implement.** None user-visible. Enables everything else.

**Files / modules to create or modify**

- `backend/src/test/java/com/resumeanalyzer/analyser/DeterministicAnalyzerTest.java` — **[new]** characterisation tests that pin the *current* 7-dimension scores and weights so later refactors cannot silently regress the preserved ATS checker.
- `backend/src/test/java/com/resumeanalyzer/parser/ResumeParserServiceTest.java` — **[new]** characterisation tests for email/phone/skills/section detection on a fixture CV.
- `backend/src/test/resources/fixtures/strong-cv.txt`, `weak-cv.txt` — **[new]** source CV fixtures (mirror `career-compass/tests/fixtures.ts` intent).
- `backend/src/main/resources/db/migration/V2__baseline_constraints.sql` — **[new]** add indexes/constraints (e.g. `resumes(user_id)`, `resume_analyses(resume_id, analyzed_at)`), idempotent.
- `backend/src/main/java/com/resumeanalyzer/common/ApiError.java` + wire into `exception/GlobalExceptionHandler.java` — **[new/modify]** standardise `{code, message}` payloads while keeping current status codes.
- `.github/workflows/ci.yml` — **[new, rec]** run `mvn -f backend/pom.xml verify` and `npm --prefix frontend ci && npm --prefix frontend run build`.
- `Makefile` — **[modify]** add a `verify` target.

**Dependencies / prerequisites.** None. Java 21 + Maven + Node present.

**Implementation tasks (in order).**

1. Add the CV fixtures and the parser characterisation tests; run them and record current outputs.
2. Add the analyzer characterisation tests asserting weights sum to 100 and the weighted average matches `overallScore`.
3. Add `V2` migration (indexes only) and confirm both dev (H2) and a MySQL profile validate.
4. Introduce `ApiError` and adapt `GlobalExceptionHandler` without changing existing status codes or messages things depend on.
5. Add the CI workflow and the `make verify` target.
6. Confirm `mvn -f backend/pom.xml verify` and `npm --prefix frontend run build` pass.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test
mvn -f backend/pom.xml -q verify
npm --prefix frontend ci
npm --prefix frontend run build
```

**Acceptance criteria.**

- [ ] All existing tests still pass; new parser/analyzer characterisation tests pass and assert captured values.
- [ ] `overallScore` is proven to equal the weighted average of the seven dimensions.
- [ ] Error responses remain backward compatible (`{message}` still present or mapped) — verified by the existing `AuthControllerTest`.
- [ ] CI workflow is present and runs both builds.

**Suggested commit messages (conventional commits).**

```
test(analysis): add characterisation tests for parser and ATS engine
build(ci): add backend and frontend verification workflow
feat(api): standardise error responses on a shared ApiError contract
chore(db): add baseline indexes via V2 migration
```

---

### Phase 1 — Shared taxonomy + full CV parser parity · **P0**

**Objective.** Port `career-compass`'s deterministic parser and taxonomy to Java so the structured CV model and skill dictionary exist server-side. This is the foundation for the 10-dimension engine, matching, editor and skill-gap analysis.

**Features to implement.** Rich structured parse (contact, sections, skills with categories/aliases, experience, education, projects, certifications, languages, stats), skill detection with aliases, section detection by heading dictionary, TXT support.

**Files / modules.**

- `analysis/taxonomy/SkillDictionary.java`, `RoleProfiles.java`, `HeadingDictionary.java`, `Stopwords.java` — **[new]** port of `career-compass/src/convex/lib/taxonomy.ts`.
- `analysis/taxonomy/SkillEntry.java`, `RoleProfile.java`, `DetectedSkill.java` — **[new]** value types.
- `cv/parser/ParsedResume.java` — **[modify]** expand to the full model (`contact`, `sections`, `sectionKeys`, `skills`, `listedSkills`, `experience[]`, `education[]`, `projects[]`, `certifications`, `languages`, `summary`, `stats`).
- `cv/parser/ResumeParserService.java` — **[modify]** re-implement parsing against the full model; keep the existing `extractRawText` entry point intact.
- `cv/parser/ResumeSectionDetector.java`, `ExperienceParser.java`, `EducationParser.java`, `ProjectParser.java` — **[new]** focused helpers.
- `cv/parser/TxtResumeParser.java` — **[new]** plain-text extractor.
- `cv/parser/CvStats.java` — **[new]** word count, bullet count, averaged/longest bullet words, quantified bullets, action-verb bullets, uppercased lines, encoding artefacts, date-range count.

**Dependencies / prerequisites.** Phase 0. No new Maven dependencies.

**Implementation tasks (in order).**

1. Port the skill dictionary verbatim (names, categories, aliases, case-sensitive aliases like `Go`) into `SkillDictionary`, and implement `detectSkills(text)` with regex alternation and mention counting.
2. Port role profiles and a `findRoleProfile` resolver (substring matching on role text).
3. Port headings/stopwords.
4. Expand `ParsedResume` and its tests; keep `parseText` callers compiling.
5. Implement contact extraction (email/phone/name/location/links) and section detection using the heading dictionary.
6. Implement entry grouping for experience/education/projects and the `CvStats` computation.
7. Add `TxtResumeParser` and route `.txt` in `extractRawText`.
8. Port `career-compass/tests/resumeParser.test.ts` assertions as `ResumeParserServiceTest` cases (contact block, section ambiguity, entry grouping, project stack lines, determinism, "no invented skills").

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=ResumeParserServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Parsing the strong-CV fixture yields the expected email, phone, ≥10 canonical skills with categories, and the expected section keys.
- [ ] Parsing is deterministic (same input ⇒ identical `ParsedResume`).
- [ ] A CV that mentions no Kubernetes/Master-level content produces neither in the parse (no-fabrication).
- [ ] `.txt`, `.pdf` and `.docx` all extract text.

**Suggested commit messages.**

```
feat(cv): port deterministic skill taxonomy and role profiles to Java
feat(cv): implement structured CV parser with entries and statistics
feat(cv): support plain-text CV extraction
```

---

### Phase 2 — ATS engine parity: 10 dimensions, issues, keywords, grades · **P0**

**Objective.** Replace the 7-dimension scoring with the reference's 10-dimension explainable engine while **preserving the current ATS behaviour** as far as the API allows. Every deduction produces a severity, explanation and recommendation; keyword relevance works in three modes.

**Features to implement.** Dimensions `structure 16, keywords 14, skills 14, experience 10, contact 10, formatting 8, education 8, projects 8, readability 6, impact 6`; issue list ordered by severity then weight; highlights; `nextSteps`; keyword analysis (`job_description` / `target_role` / `general`); grades A–E; career-stage-aware required sections.

**Files / modules.**

- `analysis/engine/AtsEngine.java` — **[new]** orchestrator (mirror of `analyzeResume`).
- `analysis/engine/dimension/*.java` — **[new]** one class per dimension: `ContactDimension`, `FormattingDimension`, `StructureDimension`, `KeywordsDimension`, `SkillsDimension`, `ExperienceDimension`, `EducationDimension`, `ProjectsDimension`, `ReadabilityDimension`, `ImpactDimension`.
- `analysis/engine/KeywordAnalyzer.java`, `GradeCalculator.java` — **[new]**.
- `analysis/engine/AtsIssue.java`, `AtsDimension.java`, `AtsAnalysis.java` — **[new]** result types.
- `analysis/CareerStageRules.java` — **[new]** required sections per career stage.
- `analysis/service/impl/AnalysisServiceImpl.java` — **[modify]** call the new engine; keep persisting `ResumeSection`/`Recommendation` for backward compatibility, and add the new fields.
- `analysis/entity/ResumeAnalysis.java`, `ResumeSection.java`, `Recommendation.java` — **[modify]** add `grade`, `band`, `engineVersion`, keyword columns; add `severity`, `explanation`, `recommendationText`, `dimension` to recommendations.
- `backend/src/main/resources/db/migration/V3__analysis_engine_fields.sql` — **[new]** new columns.
- `analyser/DeterministicAnalyzer.java` — **[modify]** keep as a thin adapter or deprecate in favour of `AtsEngine` (see risk §9.5).

**Dependencies / prerequisites.** Phase 1.

**Implementation tasks (in order).**

1. Add the result types and `GradeCalculator`; add `CareerStageRules`.
2. Implement `KeywordAnalyzer` (three modes) and port `extractJobKeywords`.
3. Implement the ten dimension classes one at a time, each with focused unit tests, porting assertions from `career-compass/tests/atsEngine.test.ts`.
4. Implement `AtsEngine.analyze` (weighted average, issue sorting, next steps).
5. Add the DB columns and map the new output into `ResumeAnalysisDto` (additive, non-breaking).
6. Wire `AnalysisServiceImpl` to the engine; keep the existing `sections`/`recommendations` DTO shape populated.
7. Add `careerStage`, `targetRole`, `jobDescription` to the analyze request (optional inputs; default `student`/absent).

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=AtsEngineTest,KeywordAnalyzerTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] `DIMENSION_WEIGHTS` sum to exactly 100; `overallScore` equals the weighted average (asserted).
- [ ] The engine is deterministic (identical input ⇒ byte-identical analysis).
- [ ] A structured/quantified CV scores strictly higher than an unstructured one.
- [ ] Missing email ⇒ a `critical` contact issue; missing metrics ⇒ a `warning` impact issue.
- [ ] Keyword analysis: Java/Spring Boot/PostgreSQL matched, Kubernetes missing against the canonical job-description fixture.
- [ ] Existing `GET /api/analyses/{id}` response still deserialises in the Angular client (additive fields only).

**Suggested commit messages.**

```
feat(analysis): implement 10-dimension explainable ATS engine
feat(analysis): add keyword relevance analysis with three modes
feat(analysis): grade and career-stage-aware section expectations
chore(db): add analysis engine columns via V3 migration
```

---

### Phase 3 — CV versioning, re-scan, and score trend · **P0**

**Objective.** Introduce CV versions so re-uploading or re-scanning preserves history and the client can compare scores — the reference's central data-model design.

**Features to implement.** `version`, `isCurrent`, `label`, `careerStage`, `targetRole`, `jobDescription`, stored `parsed` snapshot, denormalised `score`/`grade`/`analyzedAt`; re-scan with a new target; set current; rename.

**Files / modules.**

- `cv/entity/Resume.java` — **[modify]** add versioning + target fields + denormalised score fields; add `@Version` for optimistic locking.
- `cv/repository/ResumeRepository.java` — **[modify]** `findByUserIdAndIsCurrentTrue`, version-count query.
- `cv/service/impl/ResumeServiceImpl.java` — **[modify]** version-on-upload; add `reanalyze`, `setCurrent`, `rename`.
- `cv/controller/ResumeController.java` — **[modify]** add `PUT /{id}/current`, `PATCH /{id}`, `POST /{id}/reanalyze`.
- `backend/src/main/resources/db/migration/V4__resume_versioning.sql` — **[new]** columns + backfill `version=1`, `isCurrent=true` for existing rows.
- `analysis/service/impl/AnalysisServiceImpl.java` — **[modify]** write denormalised score/grade/analyzedAt on each analysis insert.
- `docs/` (see below) — **[new/rec]** a short `docs/DATA_MODEL.md` capturing the versioning semantics.

**Dependencies / prerequisites.** Phases 1–2.

**Implementation tasks (in order).**

1. Add columns via `V4`, with a backfill so existing rows remain valid under `ddl-auto: validate` (prod).
2. Add repository queries.
3. Implement version-on-upload: `version = max(version)+1`, flip previous `isCurrent=false`.
4. Implement re-scan: re-run the engine with new `targetRole`/`jobDescription`, append an analysis, update denormalised fields.
5. Implement `setCurrent` and `rename` with ownership checks.
6. Add indexes from Phase 0 (user, isCurrent).

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=ResumeServiceTest,ResumeVersioningTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Uploading twice yields `version=1` then `version=2`, with only the latest `isCurrent`.
- [ ] Re-scan against a new target role produces a new analysis and updates denormalised `score`.
- [ ] Deleting a version removes its analyses (cascade) and leaves the others intact.
- [ ] Existing list/detail endpoints still return the same fields (additive only).

**Suggested commit messages.**

```
feat(cv): version CVs and preserve analysis history
feat(cv): re-scan a CV against a new target role or job ad
feat(cv): rename and set the current CV version
chore(db): add resume versioning columns via V4 migration
```

---

### Phase 4 — Persistent recommendations with status · **P1**

**Objective.** Promote each ATS finding to its own row the user can work through and mark resolved, with a stable key surviving re-scans (mirror of `recommendations.ts`).

**Features to implement.** `key` (`dimension:issueId`), `dimension`, `category`, `priority`, `title`, `problem`, `why`, `action`, `status` (`open`/`done`/`dismissed`), timestamps; idempotent upsert on re-scan.

**Files / modules.**

- `analysis/entity/Recommendation.java` — **[modify]** extend with the reference fields.
- `analysis/repository/RecommendationRepository.java` — **[modify]** `findByUserId`, `findByResumeIdAndKey`.
- `analysis/service/impl/AnalysisServiceImpl.java` — **[modify]** upsert recommendations keyed by `resumeId+key`.
- `recommendation/controller/RecommendationController.java`, `service/`, `dto/` — **[new]** `GET /api/recommendations`, `PATCH /api/recommendations/{id}` (status).
- `backend/src/main/resources/db/migration/V5__persistent_recommendations.sql` — **[new]**.

**Dependencies / prerequisites.** Phases 2–3.

**Implementation tasks (in order).**

1. Extend the entity + migration; keep the existing `analysis_id` FK for compatibility.
2. Implement upsert-on-analysis keyed by `resumeId+key`.
3. Add list/status endpoints with ownership checks.
4. Mark resolved status preserved across re-scans.

**Tests / verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=RecommendationServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Re-scanning does not duplicate recommendations (stable `key`).
- [ ] Marking one `done` survives a re-scan.
- [ ] Recommendations are scoped to the owning user.

**Suggested commit messages.**

```
feat(recommendation): persist findings with status tracking
feat(recommendation): add list and status endpoints
chore(db): add persistent recommendation columns via V5 migration
```

---

### Phase 5 — Candidate profile + career-readiness dashboard · **P1**

**Objective.** Add the candidate profile and readiness metric that feed matching and the dashboard.

**Features to implement.** Profile (name, headline, contact, target role, career goal, years experience, location, preferred locations, work mode, job types, skills, languages, links); profile completeness; career readiness (CV 40% + profile 30% + pipeline 30%) with a "next action".

**Files / modules.**

- `profile/entity/CandidateProfile.java`, `repository/`, `service/impl/ProfileServiceImpl.java`, `controller/ProfileController.java`, `dto/` — **[new]**.
- `profile/CareerOptions.java` — **[new]** target-role catalogue + goal/work-mode descriptions (port `lib/career.ts`).
- `profile/CompletenessCalculator.java` — **[new]**.
- `dashboard/ReadinessCalculator.java` — **[new]**; `dashboard/service/impl/DashboardServiceImpl.java` — **[modify]** return readiness + completeness.
- `backend/src/main/resources/db/migration/V6__candidate_profiles.sql` — **[new]**.

**Dependencies / prerequisites.** Phase 2 (for CV score), Phase 3.

**Implementation tasks (in order).**

1. Entity + migration + repository.
2. `GET /api/profile`, `PUT /api/profile` with ownership.
3. Port completeness + readiness calculators (pure, tested).
4. Extend `DashboardStatsDto` with readiness parts and next action (additive).
5. Keep the existing `UserController` `/api/users/me` working; profile is a separate resource.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=CompletenessCalculatorTest,ReadinessCalculatorTest,ProfileServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Completeness percent and missing list match the ten reference checks.
- [ ] Readiness formula reproduces the reference weights and next-action ordering.
- [ ] Dashboard response remains backward compatible.

**Suggested commit messages.**

```
feat(profile): add candidate profile resource and endpoints
feat(dashboard): add profile completeness and career readiness metrics
chore(db): add candidate_profiles table via V6 migration
```

---

### Phase 6 — Companies, jobs catalog, and job-matching engine · **P1**

**Objective.** Provide the job/company data and the deterministic 5-dimension match engine.

**Features to implement.** Seeded companies and jobs; search/filter; job detail; match scoring across skills 45, seniority 18, location 15, role 12, extras 10, with matched/missing/bonus skills, blockers, and recommendations.

**Files / modules.**

- `catalog/entity/Company.java`, `Job.java`; `repository/`; `service/impl/CatalogServiceImpl.java`; `controller/CatalogController.java`; `dto/` — **[new]**.
- `catalog/JobCatalogSeeder.java` — **[new]** seed from a resource file (port `lib/jobCatalog.ts`).
- `catalog/resources/jobs-seed.json`, `companies-seed.json` — **[new]**.
- `matching/JobMatcher.java`, `MatchDimension.java`, `JobMatchResult.java`, `MatchableJob.java`, `MatchableCandidate.java` — **[new]** pure engine (port `lib/jobMatcher.ts`).
- `matching/MatchController.java`, `service/impl/MatchServiceImpl.java` — **[new]** `GET /api/jobs/{id}/match`.
- `backend/src/main/resources/db/migration/V7__catalog.sql` — **[new]** `companies`, `jobs` + indexes.

**Dependencies / prerequisites.** Phase 1 (taxonomy), Phase 5 (profile).

**Implementation tasks (in order).**

1. Entities, migration, indexes; seeder idempotent on slug.
2. Catalog search (`q`, country, work mode, experience level) with bounded results.
3. Port the match engine; canonicalise skills via `SkillDictionary`.
4. Merge candidate skills from profile + current CV.
5. `GET /api/jobs/{id}/match` composing profile + current CV + job.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=JobMatcherTest,CatalogServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Match weights sum to 100; score equals weighted average (asserted).
- [ ] Missing required skills appear in `missingSkills` and produce a recommendation.
- [ ] Seniority/location blockers fire at the documented thresholds.
- [ ] Seeding is idempotent (no duplicate slugs on restart).

**Suggested commit messages.**

```
feat(catalog): add companies and jobs with search endpoints
feat(matching): port deterministic job-matching engine to Java
chore(db): add catalog tables via V7 migration
```

---

### Phase 7 — Application tracking · **P1**

**Objective.** Let users save, apply to, and track jobs across statuses with a timeline.

**Features to implement.** `applications` with status (`saved`→`applied`→`interview`→`offer`/`rejected`), `applicationEvents` timeline, notes/next action, link to the CV used.

**Files / modules.**

- `application/entity/JobApplication.java`, `ApplicationEvent.java`; `repository/`; `service/impl/ApplicationServiceImpl.java`; `controller/ApplicationController.java`; `dto/` — **[new]**.
- `application/ApplicationStatus.java` — **[new]** enum + transition rules.
- `backend/src/main/resources/db/migration/V8__applications.sql` — **[new]**.

**Dependencies / prerequisites.** Phase 6.

**Implementation tasks (in order).**

1. Entities + migration (`by_user`, `by_user_status` indexes).
2. `saveJob`, `applyToJob`, `updateStatus`, `update`, `remove`, `list`, `get` — each writing an `ApplicationEvent`.
3. Block deletion/transition invariants as in the reference.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=ApplicationServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Each status change appends exactly one event with `fromStatus`/`toStatus`.
- [ ] Applications are owner-scoped; a foreign id returns not-found.
- [ ] Dashboard readiness reflects the application/interview/offer counts.

**Suggested commit messages.**

```
feat(application): track job applications with a status timeline
feat(application): add application CRUD endpoints
chore(db): add applications and events via V8 migration
```

---

### Phase 8 — CV editor, ATS template, and PDF export · **P1**

**Objective.** Turn findings into an editable CV and a downloadable ATS-friendly PDF, deterministically and without inventing content.

**Features to implement.** Draft from parsed CV; canonical ATS text generation (filler removal, gerund→past rewrite, normalised headings); guided-fix mapping (finding → editor field); text-selectable PDF export.

**Files / modules.**

- `cv/entity/ResumeDraft.java`; `repository/`; `service/impl/CvEditorServiceImpl.java`; `controller/CvEditorController.java`; `dto/` — **[new]**.
- `cv/editor/CvImprover.java` — **[new]** pure (port `lib/cvImprover.ts`).
- `cv/template/AtsTemplateBuilder.java`, `AtsDocument.java` — **[new]**.
- `cv/template/PdfExporter.java` — **[new]** using PDFBox (winner: no new dependency).
- `cv/guided/GuidedFixResolver.java` — **[new]** (port `lib/cv/guidedFixes.ts`).
- `backend/src/main/resources/db/migration/V9__resume_drafts.sql` — **[new]**.

**Dependencies / prerequisites.** Phases 2, 3.

**Implementation tasks (in order).**

1. `CvImprover`: `buildDraftFromParsed`, `rewriteBullet`, `generateAtsText`, `countFillerPhrases`; port `tests/cvEditor.test.ts` assertions.
2. Persist drafts (`resume_drafts` one per source CV).
3. `AtsTemplateBuilder` producing the canonical text; `PdfExporter` producing A4, single-column, selectable text via PDFBox.
4. `GuidedFixResolver` mapping dimension+title → editor target.
5. Endpoints: `GET /api/cvs/{id}/editor`, `PUT /api/cvs/{id}/draft`, `POST /api/cvs/{id}/generate`, `GET /api/cvs/{id}/pdf`.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=CvImproverTest,AtsTemplateBuilderTest,PdfExporterTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] `generateAtsText` removes filler and opens bullets with action verbs, and copies employers/dates/degrees verbatim.
- [ ] No fact appears in generated text that was not in the draft (asserted).
- [ ] The exported PDF opens and yields the expected selectable text (assert with PDFBox text extraction in the test).
- [ ] Guided fixes resolve the documented targets.

**Suggested commit messages.**

```
feat(cv): add editable draft and deterministic ATS text generator
feat(cv): map findings to guided editor fixes
feat(cv): export ATS template to a text-selectable PDF
chore(db): add resume_drafts via V9 migration
```

---

### Phase 9 — Job-description generator (template + optional AI) · **P2**

**Objective.** Generate a representative job description for a target role, AI-first with a deterministic template fallback.

**Features to implement.** Draft with summary/responsibilities/requirements/required+nice skills/keywords; `generator ∈ {llm, template}`; honest notes; derived keywords feed the CV scanner.

**Files / modules.**

- `ai/ChatClient.java`, `ai/OpenAiCompatibleChatClient.java` — **[new]**.
- `jobdescription/entity/JobDescriptionDraft.java`; `repository/`; `service/impl/JobDescriptionServiceImpl.java`; `controller/JobDescriptionController.java`; `dto/` — **[new]**.
- `jobdescription/template/TemplateJdGenerator.java` — **[new]** deterministic fallback.
- `jobdescription/prompt/JdPrompt.java`, `jobdescription/schema/JdSchema.java` — **[new]** (Jackson-based validation).
- `backend/src/main/resources/db/migration/V10__job_description_drafts.sql` — **[new]**.

**Dependencies / prerequisites.** Phases 1, 5; `ai/` abstraction.

**Implementation tasks (in order).**

1. Add the `ChatClient` abstraction + OpenAI-compatible implementation + config.
2. Template generator (works with no key).
3. Prompt + schema validation + sanitisation (port `lib/jobDescription/*`).
4. Service: try LLM up to N attempts, validate, then fall back to template with notes.
5. Endpoints: `POST /api/job-descriptions`, `GET /api/job-descriptions`, `GET /{id}`, `DELETE /{id}`.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=TemplateJdGeneratorTest,JdSchemaTest,JobDescriptionServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] With no API key, a valid template draft with `generator=template` and notes is returned.
- [ ] Malformed LLM output never persists; the fallback is used.
- [ ] Prompt-injection text (angle brackets/control chars) is neutralised.
- [ ] Derived keywords run a CV scan without error.

**Suggested commit messages.**

```
feat(ai): add provider-agnostic chat client with offline fallback
feat(jobdescription): generate job descriptions with a template fallback
feat(jobdescription): persist and manage generated descriptions
chore(db): add job_description_drafts via V10 migration
```

---

### Phase 10 — Interview preparation planner + question bank · **P2**

**Objective.** Deterministic, explainable interview preparation plans and a practice question bank.

**Features to implement.** Plans (target role, days, daily minutes, intensity, categories, focus skills); generated tasks rotating categories; progress tracking; question bank with own-answer practice.

**Files / modules.**

- `interview/entity/InterviewPlan.java`, `PrepTask.java`, `InterviewQuestion.java`, `QuestionPractice.java`; `repository/`; `service/impl/InterviewServiceImpl.java`; `controller/InterviewController.java`; `dto/` — **[new]**.
- `interview/InterviewPlanner.java` — **[new]** pure (port `lib/interviewPlanner.ts`).
- `interview/QuestionBankSeeder.java`, `resources/questions-seed.json` — **[new]** (port `lib/questionBank.ts`).
- `backend/src/main/resources/db/migration/V11__interview_prep.sql` — **[new]**.

**Dependencies / prerequisites.** Phase 6 (job + match gaps), Phase 5 (profile).

**Implementation tasks (in order).**

1. Port the planner (task pools, rotations, progress) with unit tests.
2. Entities + migration + indexes.
3. Seed the question bank idempotently.
4. Plan CRUD + task toggle + agenda + progress.
5. Question practice save/list.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=InterviewPlannerTest,InterviewServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] The planner is deterministic for identical input.
- [ ] Missing skills from the match engine appear as technical tasks.
- [ ] Plan progress percent equals done/total (asserted).
- [ ] Question bank seeding is idempotent.

**Suggested commit messages.**

```
feat(interview): add deterministic interview preparation planner
feat(interview): add practice question bank and answer tracking
chore(db): add interview tables via V11 migration
```

---

### Phase 11 — RAG foundation · **P2**

**Objective.** Build the pure RAG building blocks (chunking, embeddings, retrieval, grounding) that Phases 12–13 consume, each independently testable.

**Features to implement.** Deterministic chunker (heading-aware, overlap); `EmbeddingClient` with gateway + local hashing fallback; hybrid retrieval (semantic + keyword + skill-tag + difficulty + trust, floor, per-resource dedupe, top-k); merging across queries; JSON extraction + grounding helpers.

**Files / modules.**

- `ai/EmbeddingClient.java`, `ai/OpenAiCompatibleEmbeddingClient.java`, `ai/LocalHashEmbedder.java`, `ai/Cosine.java` — **[new]** (port `lib/rag/embedding.ts`, `providers.ts`).
- `roadmap/rag/Chunker.java`, `ChunkPresets.java` — **[new]** (port `lib/rag/chunking.ts`).
- `roadmap/rag/Retrieval.java`, `ScoredChunk.java`, `RetrievalOptions.java` — **[new]** (port `lib/rag/retrieval.ts`).
- `roadmap/rag/JsonExtractor.java`, `GroundingSupport.java`, `Sanitizer.java` — **[new]** (port schema/sanitisation helpers).
- `resource/entity/LearningResource.java`, `ResourceChunk.java`; `repository/` — **[new]**.
- `backend/src/main/resources/db/migration/V12__learning_resources_and_chunks.sql` — **[new]** `learning_resources`, `resource_chunks` (embedding `LONGTEXT`, `model` column, indexes).

**Dependencies / prerequisites.** Phases 1, 9 (AI client), 5.

**Implementation tasks (in order).**

1. `LocalHashEmbedder` (signed FNV-1a feature hashing, unigrams+bigrams+skill features, L2-normalised) + cosine.
2. `EmbeddingClient` interface + gateway implementation + runtime fallback selection.
3. Chunker (deterministic, tested).
4. Retrieval scoring + floor + dedupe + top-k + merge.
5. JSON extractor (fence/prose stripping) + grounding helpers + sanitiser.
6. Entities/migration; resource seeder (idempotent on slug + `contentHash`).

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=ChunkerTest,EmbeddingTest,RetrievalTest,JsonExtractorTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Chunking is deterministic and respects max size/overlap.
- [ ] Retrieval ranks a query-matching chunk above an off-topic one; the floor drops weak chunks; one chunk per resource is kept.
- [ ] Vectors from different models are never compared.
- [ ] Provider layer is tested with an injected/faked HTTP client (no paid calls).

**Suggested commit messages.**

```
feat(rag): add deterministic chunker and hybrid retrieval
feat(ai): add embedding client with local hashing fallback
chore(db): add learning resource and chunk tables via V12 migration
```

---

### Phase 12 — Learning roadmap (RAG) · **P2**

**Objective.** Turn a CV, target role and optional job description into a grounded, week-by-week study plan whose every resource comes from the curated corpus.

**Features to implement.** Deterministic skill-gap analysis; gap-status corrections; generation with strict prompt + validation + grounding; deterministic template fallback; progress toggles.

**Files / modules.**

- `roadmap/entity/Roadmap.java`, `RoadmapItem.java`; `repository/`; `service/impl/RoadmapServiceImpl.java`; `controller/RoadmapController.java`; `dto/` — **[new]**.
- `roadmap/rag/SkillGapAnalyzer.java` — **[new]** (port `lib/rag/skillGap.ts`).
- `roadmap/rag/RoadmapPrompt.java`, `RoadmapSchema.java`, `RoadmapGrounder.java`, `TemplateRoadmapGenerator.java` — **[new]**.
- `roadmap/RoadmapGenerationJob.java` — **[new]** `@Async` orchestration + stale-run guard.
- `backend/src/main/resources/db/migration/V13__roadmaps.sql` — **[new]** `roadmaps`, `roadmap_items`.

**Dependencies / prerequisites.** Phases 1, 5, 11.

**Implementation tasks (in order).**

1. `SkillGapAnalyzer` (demonstrated/required/missing/alreadyCovered/topics/warnings + status-only corrections).
2. Prompt + schema + grounding + template fallback.
3. Async generation with status machine and stale guard.
4. Endpoints: `POST /api/roadmaps/analyze`, `PATCH /api/roadmaps/{id}` (corrections), `POST /{id}/generate`, `GET`, `GET`, `PATCH` task/week done, `DELETE`.
5. Resource index rebuild endpoint.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=SkillGapAnalyzerTest,RoadmapSchemaTest,TemplateRoadmapGeneratorTest,RoadmapServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Skill-gap analysis is deterministic and classifies the canonical example correctly.
- [ ] Grounding drops model-invented resources and rewrites titles/URLs to catalogue values.
- [ ] With no key, the template planner produces a valid, labelled plan.
- [ ] A stale `generating` run older than the threshold can be restarted.

**Suggested commit messages.**

```
feat(roadmap): add deterministic skill-gap analysis
feat(roadmap): generate grounded learning roadmaps with template fallback
chore(db): add roadmaps and roadmap_items via V13 migration
```

---

### Phase 13 — AI Career Copilot (RAG chat) · **P2**

**Objective.** Chat over the user's own documents with answers grounded in retrieved passages and citations that must resolve to real text.

**Features to implement.** Private documents + chunks; conversations + messages; retrieval + strict grounded prompt; structural validation; grounding (drop unresolved citations, downgrade confidence); deterministic "couldn't find it" fallback.

**Files / modules.**

- `copilot/entity/CopilotDocument.java`, `CopilotChunk.java`, `CopilotConversation.java`, `CopilotMessage.java`; `repository/`; `service/impl/CopilotServiceImpl.java`; `controller/CopilotController.java`; `dto/` — **[new]**.
- `copilot/rag/CopilotRetrieval.java`, `CopilotPrompt.java`, `AnswerSchema.java`, `CitationGrounder.java` — **[new]** (port `lib/copilot/*`).
- `copilot/CopilotIndexingJob.java`, `CopilotAskJob.java` — **[new]** `@Async`.
- `backend/src/main/resources/db/migration/V14__career_copilot.sql` — **[new]**.

**Dependencies / prerequisites.** Phase 11 (shared RAG + embeddings), Phase 3 (import current CV).

**Implementation tasks (in order).**

1. Entities + migration + indexes.
2. Document upload → extract → chunk → embed (async status).
3. Retrieval + bounded prompt + answer schema + grounding.
4. Conversation/message persistence; import-current-CV without a second upload.
5. Endpoints: `POST /api/copilot/documents`, `GET/DELETE documents`, `GET /{id}/sources`, `POST /api/copilot/chat`, conversation CRUD.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml -q test -Dtest=CopilotRetrievalTest,CitationGrounderTest,CopilotServiceTest
mvn -f backend/pom.xml -q verify
```

**Acceptance criteria.**

- [ ] Every persisted citation resolves to a retrieved passage (asserted).
- [ ] Unmatched citations are dropped; empty survivors downgrade confidence.
- [ ] With no key, the deterministic verbatim-extract / "couldn't find enough information" path is used.
- [ ] Documents/conversations are strictly owner-scoped.

**Suggested commit messages.**

```
feat(copilot): add document indexing and grounded retrieval
feat(copilot): answer with validated, grounded citations
chore(db): add career copilot tables via V14 migration
```

---

### Phase 14 — Final verification and hardening · **P0 (executed last)**

**Objective.** Prove the whole system builds, behaves, degrades safely, and preserves existing behaviour.

**Features to implement.** None new; this phase is verification, security hardening and documentation.

**Files / modules.**

- `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/API.md` — **[new/rec]**.
- `backend/src/test/.../integration/` — **[new]** end-to-end MockMvc flows.
- `config/SecurityConfig.java`, `application*.yml` — **[modify]** hardening.

**Dependencies / prerequisites.** All prior phases.

**Implementation tasks (in order).**

1. Full build + test sweep on both apps.
2. Integration tests: auth → upload → scan → recommendations → editor → PDF; profile → match → application; roadmap → generation; copilot → grounded answer.
3. Security review: CORS origins, JWT secret externalisation, file-type/size validation, ownership on every endpoint, no secrets in logs.
4. AI degrade-path verification with the key unset.
5. Regression check that all pre-migration endpoints behave unchanged.
6. Write/refresh documentation.

**Tests and verification commands.**

```bash
mvn -f backend/pom.xml clean verify
npm --prefix frontend ci
npm --prefix frontend run build
npm --prefix frontend test -- --watch=false
# optional smoke run:
# mvn -f backend/pom.xml spring-boot:run   (start, then hit /api/auth/register)
```

**Acceptance criteria.**

- [ ] All builds and tests green; no skipped/ignored tests introduced to force a pass.
- [ ] Every AI feature works end-to-end with no key (deterministic fallback) and with a key.
- [ ] No endpoint leaks another user's data.
- [ ] Pre-migration endpoints return compatible responses.
- [ ] Documentation reflects the delivered system.

**Suggested commit messages.**

```
test(integration): cover end-to-end feature flows
fix(security): scope CORS and externalise the JWT secret
docs(architecture): document the migrated system
```

---

## 7. Ordered Git Commit Plan

The plan below is **proposed only** — no commits are created by this task. Each commit is small, coherent, testable, and follows Conventional Commits. Run the listed tests before committing.

| # | Phase | Scope | Expected files / modules | Tests before commit | Proposed message |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | CV fixtures + parser characterisation tests | `src/test/**`, `src/test/resources/fixtures/*` | `mvn test` | `test(analysis): add parser characterisation tests` |
| 2 | 0 | ATS engine characterisation tests | `analyser/DeterministicAnalyzerTest` | `mvn test` | `test(analysis): pin current ATS scores and weights` |
| 3 | 0 | Baseline DB indexes | `V2__baseline_constraints.sql` | `mvn test` | `chore(db): add baseline indexes` |
| 4 | 0 | Shared error contract | `common/ApiError`, `GlobalExceptionHandler` | `mvn test` | `feat(api): standardise error responses` |
| 5 | 0 | CI workflow | `.github/workflows/ci.yml` | CI dry run | `build(ci): add verification workflow` |
| 6 | 1 | Skill dictionary + role profiles | `analysis/taxonomy/*` | `mvn test -Dtest=TaxonomyTest` | `feat(cv): port skill taxonomy to Java` |
| 7 | 1 | Full structured parser | `cv/parser/*` | `mvn test -Dtest=ResumeParserServiceTest` | `feat(cv): structured CV parser with stats` |
| 8 | 1 | TXT extraction | `cv/parser/TxtResumeParser` | `mvn test` | `feat(cv): support plain-text uploads` |
| 9 | 2 | Engine result types + grades | `analysis/engine/*` | `mvn test` | `feat(analysis): add dimension and issue model` |
| 10 | 2 | Keyword analyzer | `analysis/engine/KeywordAnalyzer` | `mvn test` | `feat(analysis): keyword relevance analysis` |
| 11 | 2 | Ten dimensions + engine | `analysis/engine/dimension/*`, `AtsEngine` | `mvn test -Dtest=AtsEngineTest` | `feat(analysis): 10-dimension ATS engine` |
| 12 | 2 | Persist engine fields | `V3`, entities, DTO mapping | `mvn test` | `chore(db): persist extended analysis fields` |
| 13 | 3 | CV versioning | `Resume`, `V4`, `ResumeServiceImpl` | `mvn test -Dtest=ResumeVersioningTest` | `feat(cv): version CVs` |
| 14 | 3 | Re-scan / set current / rename | `ResumeController`, service | `mvn test` | `feat(cv): re-scan and manage versions` |
| 15 | 4 | Persistent recommendations | `Recommendation`, `V5`, `RecommendationController` | `mvn test` | `feat(recommendation): status-tracked findings` |
| 16 | 5 | Candidate profile | `profile/*`, `V6` | `mvn test` | `feat(profile): candidate profile resource` |
| 17 | 5 | Readiness dashboard | `dashboard/*` | `mvn test` | `feat(dashboard): career readiness` |
| 18 | 6 | Catalog + seeder | `catalog/*`, `V7`, seed resources | `mvn test` | `feat(catalog): companies and jobs` |
| 19 | 6 | Job matcher | `matching/*` | `mvn test -Dtest=JobMatcherTest` | `feat(matching): deterministic job matcher` |
| 20 | 7 | Application tracking | `application/*`, `V8` | `mvn test` | `feat(application): track applications` |
| 21 | 8 | CV improver + template | `cv/editor/*`, `cv/template/*` | `mvn test` | `feat(cv): ATS template generator` |
| 22 | 8 | Draft persistence + guided fixes | `cv/entity/ResumeDraft`, `V9`, `cv/guided/*` | `mvn test` | `feat(cv): editable draft and guided fixes` |
| 23 | 8 | PDF export | `cv/template/PdfExporter` | `mvn test -Dtest=PdfExporterTest` | `feat(cv): PDF export` |
| 24 | 9 | AI chat client + fallback | `ai/*` | `mvn test` | `feat(ai): provider-agnostic chat client` |
| 25 | 9 | JD generator | `jobdescription/*`, `V10` | `mvn test` | `feat(jobdescription): generator with fallback` |
| 26 | 10 | Interview planner | `interview/*`, `V11` | `mvn test` | `feat(interview): prep planner` |
| 27 | 10 | Question bank | `interview/QuestionBankSeeder` | `mvn test` | `feat(interview): practice question bank` |
| 28 | 11 | Chunker + retrieval | `roadmap/rag/*` | `mvn test` | `feat(rag): chunker and hybrid retrieval` |
| 29 | 11 | Embeddings + resources | `ai/*Embedding*`, `resource/*`, `V12` | `mvn test` | `feat(ai): embeddings with local fallback` |
| 30 | 12 | Skill gap + roadmap | `roadmap/*`, `V13` | `mvn test` | `feat(roadmap): grounded learning roadmap` |
| 31 | 13 | Copilot indexing + chat | `copilot/*`, `V14` | `mvn test` | `feat(copilot): grounded career copilot` |
| 32 | 14 | Integration + hardening | `src/test/integration`, `SecurityConfig`, `application*.yml` | `mvn clean verify` | `test(integration): end-to-end flows` |
| 33 | 14 | Docs | `docs/*` | — | `docs(architecture): document migrated system` |

**Optional isolated commits** (safe, mechanical): rename package root to `com.careerpilot` (touches all Java files, no behaviour change) and rename the Angular app; do these alone, never mixed with feature work.

---

## 8. Testing and Acceptance Criteria

### 8.1 Testing philosophy [rec]

Mirror `career-compass`: **engines are pure and tested directly**; services are tested with Mockito; controllers/endpoints are tested with `@WebMvcTest`/`MockMvc`; one integration sweep at the end. Port the *assertions*, not the language.

### 8.2 Test matrix

| Layer | Tool | Examples |
| --- | --- | --- |
| Engines (pure) | JUnit 5 | `AtsEngineTest`, `KeywordAnalyzerTest`, `JobMatcherTest`, `CvImproverTest`, `InterviewPlannerTest`, `SkillGapAnalyzerTest`, `ChunkerTest`, `RetrievalTest`, `CitationGrounderTest` |
| Services | JUnit + Mockito | `ResumeServiceTest`, `AnalysisServiceTest`, `ApplicationServiceTest`, `RoadmapServiceTest` |
| Controllers | `@WebMvcTest` + MockMvc | `ResumeControllerTest`, `AnalysisControllerTest`, `MatchControllerTest` |
| Persistence | `@DataJpaTest` (H2) | repository queries, cascade deletes |
| Integration | `@SpringBootTest` + MockMvc | full auth→feature flows |
| Frontend | Karma/Jasmine | component + service tests for new feature modules |

### 8.3 Global acceptance criteria

- **Parity**: every P0/P1 feature in §3 is reachable and behaves as described.
- **Determinism**: identical CV/config input ⇒ identical scores, matches, plans, generated text.
- **No fabrication**: generated CV text, roadmaps and copilot answers never add facts not present in inputs; grounded citations always resolve.
- **Degrade safely**: with no AI key, all AI-dependent features return labelled deterministic results.
- **Backward compatibility**: pre-existing endpoints and response fields still work.
- **Ownership/security**: no cross-user data access; no secrets in logs; compatible-file/size validation.
- **Green builds**: `mvn -f backend/pom.xml clean verify` and `npm --prefix frontend test -- --watch=false`.
- **No shortcuts**: no disabled/`@Disabled` tests and no weakened assertions to pass a check; any unavoidable exception must be documented and justified.

### 8.4 Phase-level verification commands (recap)

```bash
# every phase
mvn -f backend/pom.xml -q test
mvn -f backend/pom.xml -q verify

# frontend
npm --prefix frontend ci
npm --prefix frontend run build
npm --prefix frontend test -- --watch=false

# final phase
mvn -f backend/pom.xml clean verify
```

---

## 9. Risks and Mitigation Strategies

### 9.1 Authentication model mismatch

**Risk.** `career-compass` uses Convex Auth (OTP + guest); porting auth would be high-cost and high-risk.
**Mitigation [rec].** Keep CareerPilot's JWT auth. Treat OTP/guest as optional P2 work. No feature in §3 depends on the OTP flow.

### 9.2 External AI service dependency

**Risk.** Job-description generation, roadmap and copilot require an LLM/embedding gateway that may be missing, rate-limited, or changed. CareerPilot has no AI integration today.
**Mitigation [rec].** Provider interface + deterministic fallbacks (local hashing embedder, template planner, labelled verbatim extract), exactly as the reference does; retries with caps; no keys in logs; response bodies never echoed into errors.

### 9.3 Vector search on relational data

**Risk.** MySQL has no native ANN vector index; naive scans could degrade as the corpus grows.
**Mitigation [rec].** Mirror the reference: bounded, indexed candidate set + in-process cosine; store embeddings with a `model` column; never mix models; document the corpus-size ceiling and the P2 upgrade path (pgvector/Qdrant) if the corpus exceeds the designed scale.

### 9.4 Long-running generation in a synchronous stack

**Risk.** RAG generation can exceed HTTP timeouts; a crash mid-run can wedge a roadmap.
**Mitigation [rec].** Async job + persisted status machine + stale-run guard + retry endpoint; the client polls the entity.

### 9.5 Preserving the existing ATS checker

**Risk.** Replacing the 7-dimension engine could break existing clients and user expectations; the system prompt demands avoiding unnecessary rewrites.
**Mitigation [rec].** Phase 0 pins current behaviour with characterisation tests; Phase 2 keeps `ResumeSection`/`Recommendation` DTO fields populated and adds new fields additively; the old engine can remain as a compatibility adapter until clients migrate.

### 9.6 Catalog data provenance

**Risk.** Seeded companies/jobs are demonstration data; migrating them verbatim may imply relationships that do not exist.
**Mitigation [rec].** Keep seeds in a versioned resource file, mark them as seed data, make seeding idempotent and non-destructive, and document that this is not a live job feed.

### 9.7 PDF export quality

**Risk.** Producing a text-selectable, well-laid-out PDF is non-trivial.
**Mitigation [rec].** Use PDFBox (already present); test by re-extracting text in the unit test; document the reference's own limitations (no font embedding, no page-number citations).

### 9.8 Test parity effort

**Risk.** Porting 17 suites is significant; skipping them would violate the verification standard.
**Mitigation [rec].** Port assertions phase-by-phase alongside each engine, not at the end; each engine is pure so the port is mechanical.

### 9.9 Security hardening debt in CareerPilot

**Risk [fact].** `SecurityConfig` allows `*` origins **with** credentials and `application.yml` ships a default JWT secret.
**Mitigation [rec].** Make CORS origins configuration-driven (per profile) and require `JWT_SECRET` (fail fast when unset in prod) during Phase 14.

### 9.10 Data privacy

**Risk.** CV text, roadmaps and copilot documents are personal data; the copilot sends passages to an external model.
**Mitigation [rec].** Owner-scope every read/write; send only bounded retrieved passages, never whole documents or other users' data; sanitise untrusted text; log counts/models only, never content or keys; delete chunks/files with the parent record.

### 9.11 Scope creep / ordering

**Risk.** Attempting AI features before the deterministic foundation would leave nothing verifiable.
**Mitigation [rec].** Enforce phase order; each phase's acceptance criteria gate the next; deterministic engines first, AI last.

### 9.12 Features that cannot be migrated directly

- **Convex Auth / guest sessions** — different model; optional, not required.
- **Convex reactive subscriptions** (live UI updates) — replaced by polling/fetch in the Angular client; behaviour parity, not mechanism parity.
- **Convex file storage + short-lived upload URLs** — replaced by DB-stored extracted text (+ optional object storage later).
- **The `@vly-ai/integrations` SDK** — not Java; replaced by the provider abstraction over an OpenAI-compatible endpoint.

---

## 10. Final Definition of Done

The migration is complete when **all** of the following hold:

1. **Phase order honoured.** Every phase's acceptance criteria passed before the next phase began, with verification commands recorded.
2. **Feature parity.** Every P0/P1 capability in §3 is implemented, exposed via Angular routes, and covered by tests. P2 capabilities are implemented with deterministic fallbacks and are usable without an API key.
3. **Preserved core.** The existing auth, resume upload/list/detail/delete and analysis endpoints behave compatibly; the ATS checker's historical behaviour is covered by characterisation tests before and after the engine change.
4. **Determinism & no fabrication.** Automated tests assert determinism for every engine and that no generated output contains facts absent from its inputs; grounded citations always resolve.
5. **Verification green.** `mvn -f backend/pom.xml clean verify`, `npm --prefix frontend run build` and `npm --prefix frontend test -- --watch=false` all pass with no disabled tests and no weakened assertions.
6. **Security.** CORS is environment-scoped, `JWT_SECRET` is required outside dev, all endpoints enforce ownership, upload validation is server-side, and no secret or document text appears in logs.
7. **Degraded mode.** With no AI configuration, every AI-dependent feature returns a clearly labelled deterministic result; with configuration, it uses the gateway. Both paths are tested.
8. **Data model documented.** Flyway migrations `V2`–`V14` exist, the entity/table map is documented, and `ddl-auto: validate` passes against a migrated schema.
9. **Documentation.** `docs/ARCHITECTURE.md`, `docs/API.md` and `docs/FEATURES.md` describe the delivered Java system, the provider/fallback design, and the intentional differences from `career-compass` (auth model, vector storage, client-side vs server-side extraction).
10. **Handover-ready.** A subsequent agent can pick up any unstarted commit from §7, read its phase in §6, and implement and verify it without further research.

---

*End of plan. This document is a roadmap only: no application code, dependencies, configuration, or Git history were modified.*
