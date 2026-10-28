# CareerPilot — Project Overview

> **Document status.** This document describes the **repository as it exists today**. Every
> "implemented" statement is verifiable in the source tree. Anything not yet built is marked
> **Planned** and is derived from [`CAREERPILOT_MIGRATION_PLAN.md`](../CAREERPILOT_MIGRATION_PLAN.md).

---

## 1. Purpose and objectives

CareerPilot is a full-stack web application that reads a résumé the way an Applicant Tracking
System (ATS) does: it extracts the document's structure, scores it across multiple dimensions, and
returns section-by-section feedback plus prioritised, actionable recommendations.

Objectives:

1. **Explain the score.** Return a numeric ATS score *and* the dimension breakdown and written
   feedback that justify it.
2. **Be deterministic.** The same document must always produce the same score — the scoring engine
   is a set of explicit rules, not a model.
3. **Keep candidate data private.** Every résumé and analysis is scoped to the authenticated owner.
4. **Progressively grow into a career toolkit** while preserving the existing ATS checker. The
   long-term functionality is described in the migration roadmap (see §4).

> **Naming note.** The application's Maven artifact and internal packages still use
> the historical names `resume-analyzer` / `ResumeAnalyzer` / `resumeanalyzer`, and the previous
> `README.md` titled the product **"ATSense: Resume Analyzer"**. The product is referred to as
> **CareerPilot** throughout this documentation set. A package/artifact rename is an optional,
> isolated step described in the migration plan (Phase 0) and is **not** part of the current code.

---

## 2. Target users and main use cases

| User | Goal | Supported today |
| --- | --- | --- |
| Job seeker / candidate | Find out why their CV under-performs and what to fix first | ✅ Upload → analyse → read report |
| Candidate with several CV versions | Track how scores change over time | ⚠️ Re-analysis history per résumé exists; true versioning is **Planned** |
| Recruiter / reviewer | Sanity-check a document's ATS readability | ✅ via the same analysis report |
| Career switcher | Compare a CV against a specific target role or job ad | ❌ **Planned** (keyword modes, matching) |

**Primary end-to-end use case (implemented):**

1. A visitor registers or logs in (`/register`, `/login`).
2. Uploads a PDF or DOCX résumé.
3. Runs the deterministic analysis.
4. Reads the overall score, the seven dimension scores, per-section feedback and the prioritised
   recommendation list.
5. Browses the analysis history and the aggregated recommendations page.

---

## 3. Existing functionality (implemented and verified)

The following are backed by real code paths in this repository.

### 3.1 Account and authentication
- Email + password registration and login with BCrypt password hashing.
- Stateless JWT bearer authentication; every non-auth endpoint requires a valid token.
- Owner-scoped profile read/update (`username`).
- The frontend stores the token in `localStorage`, attaches it via an HTTP interceptor, guards
  private routes with `authGuard` and redirects authenticated users away from `login`/`register`
  with `guestGuard`.

### 3.2 Résumé management
- Upload a **PDF or DOCX** file (max **10 MB**) as `multipart/form-data`.
- Server-side text extraction with **Apache PDFBox** (PDF) and **Apache POI** (DOCX).
- List a user's résumés, view a résumé's metadata and extracted text, delete a résumé (cascades to
  its analyses).
- The extracted text is stored in the `resumes.extracted_text` column.

### 3.3 Deterministic ATS analysis
- A seven-dimension scoring engine (`DeterministicAnalyzer`) with fixed weights summing to 100%.
- Produces an overall score, seven sub-scores, seven `ResumeSection` feedback rows and a list of
  `Recommendation` rows (category + priority ∈ Critical/Important/Suggested).
- Heuristic parsing of the extracted text: email, phone, location, detected sections, skill matches
  against a ~45-entry list, action-verb matches, and quantifiable-metric counting.
- The detectors were corrected on 2026-10-28: sections are recognised from headings (not any keyword
  mention), locations from contact-block lines (not any "word, word" pair), phones from 9–15-digit
  numbers with separators (not arbitrary ids), degrees from whole tokens (not the "bs" inside
  "website"), `C++`/`C#`, and `N+`/thousands-separated metrics. Regression tests pin each fix.

### 3.4 Dashboards and history
- Dashboard stats: total résumés, total analyses, average score, best score.
- Per-résumé analysis history and a global analysis history.
- A dedicated recommendations page that aggregates recommendation rows across all of a user's
  analyses and filters by priority and category.

### 3.5 Cross-cutting
- A standardised error payload (`ApiError`: `timestamp, status, error, code, message, path`) returned
  by a global exception handler for all known and unknown failures.
- Bean-validation on all request DTOs (`@NotBlank`, `@Email`, `@Size`).
- Per-user ownership enforced in every service method by querying with `…AndUserId`.
- CI workflow (`.github/workflows/ci.yml`) that runs the backend Maven build/tests and the frontend
  production build.

### 3.6 Test coverage today
- **Backend:** 5 JUnit 5 test classes (33 tests) — `AuthServiceTest`, `AuthControllerTest`,
  `GlobalExceptionHandlerTest`, `ResumeParserServiceTest` (characterisation + detector regressions)
  and `DeterministicAnalyzerTest` (characterisation + detector regressions).
- **Frontend:** 1 Vitest suite (`tests/report.test.ts`, 11 tests) covering the analysis-to-report
  mapping and upload validation.

---

## 4. Planned features (from the migration roadmap — **not implemented**)

CareerPilot intends to reach feature parity with the reference project `career-compass` (a
Vite/React/Convex prototype) while keeping **Java + Spring Boot as the core backend**. The full plan,
including phases, acceptance criteria and commit order, is in
[`CAREERPILOT_MIGRATION_PLAN.md`](../CAREERPILOT_MIGRATION_PLAN.md). Detailed feature breakdowns are in
[`FEATURE_ROADMAP.md`](FEATURE_ROADMAP.md).

High-level planned capabilities:

- **Richer CV parsing** — structured contact/sections/experience/education/projects model, ~150-skill
  taxonomy with aliases, TXT support.
- **Explainable 10-dimension ATS engine** — severity + explanation + recommendation per finding,
  keyword relevance modes, grades, career-stage-aware expectations.
- **CV versioning & re-scan** — versions, `isCurrent`, score history, re-scan against a new target.
- **Persistent recommendations** — one row per finding with status tracking.
- **Candidate profile & career-readiness dashboard.**
- **Companies/jobs catalog and a deterministic job-matching engine.**
- **Application tracking** with a status timeline.
- **CV editor, ATS template generation and PDF export.**
- **AI features (P2)** — job-description generator, interview-prep planner, RAG learning roadmap and
  an AI Career Copilot, each with deterministic offline fallbacks.
- **Hardening** — CORS scoping, externalised JWT secret, integration tests.

### 4.1 What will be preserved (not rewritten)
The existing ATS checker's behaviour is treated as a contract: Phase 0 of the plan pins the current
7-dimension scores with characterisation tests, and any engine change is required to be additive to
the existing API responses. The JWT authentication model is **kept** (the reference's OTP/guest auth
is deliberately *not* migrated).

---

## 5. Current implementation status and future goals

| Area | Status |
| --- | --- |
| Auth (JWT, register/login, profile) | ✅ Implemented |
| Résumé upload / parse (PDF, DOCX) / list / detail / delete | ✅ Implemented |
| 7-dimension deterministic ATS engine | ✅ Implemented |
| Dashboard stats, analysis history, recommendations page | ✅ Implemented |
| Standardised error contract, validation, ownership checks | ✅ Implemented |
| Backend + frontend CI | ✅ Implemented |
| Docker Compose (frontend web server, backend app, MySQL database) | ✅ Implemented |
| Structured parsing / skill taxonomy / TXT | ⏳ Planned (Phase 1) |
| 10-dimension engine / keywords / grades | ⏳ Planned (Phase 2) |
| CV versioning / re-scan | ⏳ Planned (Phase 3) |
| Persistent recommendations | ⏳ Planned (Phase 4) |
| Profile / readiness dashboard | ⏳ Planned (Phase 5) |
| Catalog / matching | ⏳ Planned (Phase 6) |
| Application tracking | ⏳ Planned (Phase 7) |
| CV editor / ATS template / PDF export | ⏳ Planned (Phase 8) |
| AI: JD generator, interview prep, roadmap, copilot | ⏳ Planned (Phases 9–13, P2) |
| Security hardening, integration tests | ⏳ Planned (Phase 14) |

**Future goals.** Complete the deterministic foundation first (parsing → engine → versioning), then
the career toolkit, and only then the AI-dependent layers, each of which must degrade to a labelled
deterministic result when no API key is configured.

---

## 6. Reference project

`career-compass` (sibling directory) is a **read-only reference** for target functionality, UI design
and algorithm intent. It is built on Vite + React 19 + TypeScript + Convex and is **not** part of the
CareerPilot build. Its behaviour is described (with file-level citations) in §2.2 of the migration
plan. No code is copied from it; algorithms are re-implemented in Java.

---

## 7. Documentation map

| Document | Contents |
| --- | --- |
| [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md) | This file — purpose, users, status, roadmap summary |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture with Mermaid diagrams |
| [`UML_DIAGRAMS.md`](UML_DIAGRAMS.md) | Use case, class, sequence, activity, component, deployment diagrams |
| [`DATABASE.md`](DATABASE.md) | Current schema, ERD, migrations, proposed changes |
| [`API.md`](API.md) | REST endpoints, DTOs, errors, proposed endpoints |
| [`FEATURE_ROADMAP.md`](FEATURE_ROADMAP.md) | Feature-by-feature plan with status and acceptance criteria |
| [`DEVELOPMENT.md`](DEVELOPMENT.md) | Setup, run, Docker Compose, build, test, troubleshoot |
| [`COMPLETION_CHECKLIST.md`](COMPLETION_CHECKLIST.md) | Remaining tasks, missing features and go-live checklist |
