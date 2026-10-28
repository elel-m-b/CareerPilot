# CareerPilot

**CareerPilot is a full-stack web application that scores a résumé the way an Applicant Tracking
System (ATS) does.** It extracts text from an uploaded PDF or DOCX, measures the document across
seven weighted dimensions, and returns a numeric score, per-section feedback and a prioritised list
of improvements.

Built with a **Spring Boot (Java 21)** REST backend and a **React 19 + TypeScript + Vite** frontend (ported from
`career-compass`), secured with JWT.

---

## Objectives

1. Explain the score — dimension breakdown and written feedback, not just a number.
2. Stay deterministic — identical input always produces the identical score.
3. Keep candidate data private — every résumé and analysis is owner-scoped.
4. Grow into a career toolkit **without breaking the existing ATS checker**.

---

## Current features (implemented)

- **Accounts & auth:** email/password registration and login, BCrypt hashing, stateless JWT, protected
  React routes.
- **Résumé management:** upload **PDF/DOCX** (max 10 MB), server-side extraction with Apache PDFBox
  and Apache POI, list, view (metadata + extracted text), delete.
- **Deterministic ATS analysis:** a **7-dimension** engine (ATS compatibility 20%, content quality
  20%, skills 15%, experience 20%, education 10%, projects 10%, structure 5%) producing an overall
  score, seven sub-scores, per-section feedback and prioritised recommendations
  (Critical / Important / Suggested). Contact, heading, degree, skill and metric detection was
  corrected in the 2026-10-28 pass: tech lists no longer count as locations, numeric ids no longer
  count as phone numbers, "website" no longer counts as a "BS" degree, `C++`/`C#` and `15+` are
  recognised, and sections come from headings rather than body mentions.
- **Dashboard & history:** totals, average and best score; per-résumé and global analysis history; an
  aggregated recommendations page with priority/category filters.
- **Cross-cutting:** a standardised `ApiError {code, message, …}` contract, bean validation,
  owner-scoped data access, and CI that builds and tests both applications.

## Frontend: Career-Compass integration

The complete Career-Compass frontend (React 19, Tailwind v4, shadcn/ui) now lives in `frontend/` and talks
to the existing Spring Boot API. Every screen from the reference is routed and present in the sidebar; the
ones whose backend APIs do not exist yet show **"Coming Soon — This feature is not implemented yet"**
rather than empty states or fake data.

| Screen | Route | Backend |
| --- | --- | --- |
| Landing page | `/` | static |
| Sign in / register | `/auth` | `POST /api/auth/login`, `/register` |
| Dashboard | `/dashboard` | `GET /api/dashboard/stats`, résumés and analyses |
| My CV (upload, list, delete) | `/cv` | `/api/resumes` |
| CV report (7 dimensions, findings, history, extracted text) | `/cv/:id` | `/api/resumes/{id}`, `/api/resumes/{id}/analyses`, `POST /api/resumes/{id}/analyze` |
| Profile | `/profile` | `GET`/`PUT /api/users/me` |
| Settings | `/settings` | dashboard stats, theme, session |
| CV editor / ATS export | `/cv/:id/edit` | **Coming Soon** |
| Jobs, JD generator, companies | `/jobs`, `/job-description`, `/companies` | **Coming Soon** |
| Applications, interview prep | `/applications`, `/prep` | **Coming Soon** |
| Learning roadmap, AI Copilot | `/roadmap`, `/copilot` | **Coming Soon** |

## Upcoming features (planned — **not yet available**)

> These come from [`CAREERPILOT_MIGRATION_PLAN.md`](CAREERPILOT_MIGRATION_PLAN.md) and are **not
> implemented**. They are listed so the direction is clear; do not rely on them today.

- Richer CV parsing (structured model, ~150-skill taxonomy, TXT support).
- Explainable **10-dimension** ATS engine with keywords, grades and career-stage awareness.
- CV **versioning** and re-scan against a target role or job ad.
- Persistent, status-tracked recommendations; candidate profile and a career-readiness dashboard.
- Companies/jobs catalog and a deterministic **job-matching** engine; application tracking.
- CV editor, ATS template and **PDF export**.
- **AI features (advanced):** job-description generator, interview-prep planner, RAG learning roadmap
  and an AI Career Copilot — each with an offline deterministic fallback.

See [`docs/FEATURE_ROADMAP.md`](docs/FEATURE_ROADMAP.md) for status, dependencies and acceptance
criteria per feature.

---

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | **React 19** + **TypeScript**, **Vite 7**, **Tailwind CSS v4**, shadcn/ui (Radix), Framer Motion, React Router 7, Vitest |
| Backend | **Java 21**, **Spring Boot 3.3.5** (Web, Data JPA, Security, Validation), Maven |
| Security | Spring Security 6, JJWT 0.12.6, BCrypt |
| Database | **H2** in-memory (dev) / **MySQL** (prod) via Spring Data JPA + Hibernate |
| Migrations | Flyway (`V1__initial_schema.sql`, `V2__baseline_constraints.sql`) |
| Parsing | Apache PDFBox 3.0.3, Apache POI 5.3.0 |

The database technology was determined from the configuration, not assumed: `application-dev.yml`
(dev, H2) and `application-prod.yml` (prod, MySQL).

---

## High-level architecture

```mermaid
graph TD
    SPA["React 19 SPA<br/>(localhost:5173)"]
    API["Spring Boot 3 REST API<br/>(localhost:8080) · /api"]
    DB[("H2 (dev) / MySQL (prod)")]
    AI["AI provider<br/>(interface only — no-op stub today)"]

    SPA -- "HTTP + JSON · JWT" --> API
    API -- "JPA / Hibernate" --> DB
    API -. optional, not implemented .-> AI
```

Full diagrams (system, frontend/backend layers, request/auth flows, deployment) are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/UML_DIAGRAMS.md`](docs/UML_DIAGRAMS.md).

---

## Repository structure

```
CareerPilot/
├── backend/                    Spring Boot API
│   ├── Dockerfile              multi-stage build → JRE image
│   ├── pom.xml
│   └── src/main/java/com/resumeanalyzer/
│       ├── controller/  service/  repository/  entity/  dto/
│       ├── parser/      analyser/  security/    config/  exception/  common/
│       └── resources/   application*.yml · db/migration/
├── frontend/                   React 19 SPA (Vite)
│   ├── Dockerfile              node build → nginx web server
│   ├── nginx.conf              SPA fallback + /api reverse proxy
│   └── src/  api/ (REST client) · components/ · hooks/ · lib/ · pages/
├── docker-compose.yml          db + backend + frontend stack
├── docs/                       technical documentation (see below)
├── .github/workflows/ci.yml    CI workflow
├── Makefile                    convenience targets
└── CAREERPILOT_MIGRATION_PLAN.md
```

---

## Prerequisites

- **JDK 21** and **Maven 3.6+**
- **Node.js 20+** and **npm**
- (Optional) **MySQL** if you want the prod profile

---

## Setup and run

Run these from the `CareerPilot/` directory.

```bash
# 1. Backend (Spring Boot, port 8080) — uses in-memory H2 in the default dev profile
mvn -f backend/pom.xml clean spring-boot:run

# 2. Frontend (React/Vite, port 5173 — proxies /api to :8080)
npm --prefix frontend install
npm --prefix frontend run dev
```

Or use the Makefile:

```bash
make backend     # backend on :8080
make frontend    # frontend on :5173
make run         # both together
```

The Vite dev server proxies `/api` to `http://localhost:8080`, so the browser stays on one origin. Point the
frontend at a different API with `VITE_API_BASE_URL` (absolute URL) or `VITE_API_PROXY_TARGET` (dev proxy).

**Key environment variables** (all optional in dev): `JWT_SECRET`, `DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `SPRING_PROFILES_ACTIVE`. Full details in [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

---

## Run with Docker Compose (frontend + backend + database)

```bash
docker compose up --build      # build images and start the stack
# open http://localhost:3000   (API directly on http://localhost:8080)
docker compose ps              # health status of every service
docker compose down            # stop; add -v to delete the database volume
```

| Service | Role | Runtime | Port |
| --- | --- | --- | --- |
| `frontend` | Web server for the built SPA; proxies `/api` to the backend | nginx 1.27 (built with Node 22) | `3000` → 80 |
| `backend` | Application service: Spring Boot REST API | JRE 21, `prod` profile, Flyway | `8080` → 8080 |
| `db` | Database service: MySQL with a named volume | MySQL 8.0 | internal only |

Startup is ordered by healthchecks: the backend waits for MySQL, nginx waits for the backend. The
frontend and backend call each other by Compose service name over the internal network. Override
credentials and ports with `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `JWT_SECRET`, `BACKEND_PORT` and
`FRONTEND_PORT` (see [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) §6.3).
`JWT_SECRET` must be replaced outside a local machine.

---

## Testing

```bash
# Backend (JUnit 5 + Spring Boot integration) — 45 tests today
mvn -f backend/pom.xml clean verify

# Frontend (Vitest)
npm --prefix frontend test

# Both via Make
make verify
```

Current verified status: backend `clean verify` → **BUILD SUCCESS, 45 tests, 0 failures**; frontend
`tsc -b` + `vite build` → **success**, Vitest → **19 tests, 0 failures**. The Compose stack was
brought up and the ATS flow was exercised through nginx (register → upload → analyse).

---

## Documentation

| Document | What it covers |
| --- | --- |
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Purpose, users, status, roadmap summary |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System, frontend, backend, auth, data, deployment architecture (Mermaid) |
| [`docs/UML_DIAGRAMS.md`](docs/UML_DIAGRAMS.md) | Use case, class, sequence, activity, component, deployment diagrams |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Tables, ERD, indexes, migrations, proposed schema |
| [`docs/API.md`](docs/API.md) | REST endpoints, DTOs, errors, proposed endpoints |
| [`docs/FEATURE_ROADMAP.md`](docs/FEATURE_ROADMAP.md) | Feature-by-feature plan with acceptance criteria |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Setup, run, Docker Compose, build, test, troubleshooting |
| [`docs/COMPLETION_CHECKLIST.md`](docs/COMPLETION_CHECKLIST.md) | Remaining tasks, missing features and the go-live checklist for the full SaaS |
| [`CAREERPILOT_MIGRATION_PLAN.md`](CAREERPILOT_MIGRATION_PLAN.md) | The upstream migration plan (proposed) |

---

## Project status and roadmap

**Status:** a working, containerised MVP. The deterministic ATS checker (with corrected extraction
rules), authentication, résumé management, dashboard and a three-service Docker Compose deployment
are implemented and verified. The AI hook exists as an interface but performs **no external calls**.
The remaining product work — versioning, profile, catalog/matching, applications, CV editor/export,
AI features, billing and operational hardening — is tracked feature by feature in
[`docs/COMPLETION_CHECKLIST.md`](docs/COMPLETION_CHECKLIST.md).

**Roadmap:** complete the deterministic foundation first (richer parsing → 10-dimension engine → CV
versioning), then the career toolkit (profile, catalog, matching, applications, CV editor), and
finally the AI-dependent features with offline fallbacks. See
[`docs/FEATURE_ROADMAP.md`](docs/FEATURE_ROADMAP.md).
