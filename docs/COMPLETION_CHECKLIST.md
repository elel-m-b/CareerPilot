# CareerPilot — SaaS Completion Checklist

> **Status date:** 2026-10-28. Every ✅ in this document is verifiable in the repository and was
> exercised locally; every unchecked box is work that **does not exist yet**. Priorities are
> **P0** (launch blocker), **P1** (required for a paid product) and **P2** (differentiator/polish).
>
> Companion documents: [`FEATURE_ROADMAP.md`](FEATURE_ROADMAP.md) (feature phases and acceptance
> criteria), [`ARCHITECTURE.md`](ARCHITECTURE.md) (current and target design), [`API.md`](API.md),
> [`DATABASE.md`](DATABASE.md), [`DEVELOPMENT.md`](DEVELOPMENT.md).

---

## 1. Where the product stands today

CareerPilot is a **working, containerised MVP**: a candidate can register, upload a PDF/DOCX résumé,
run a deterministic 7-dimension ATS scan, read the score and feedback, and browse history. A
three-service Docker Compose stack runs the SPA behind nginx, the Spring Boot API and MySQL.

### 1.1 Verified in this repository

| Capability | Status | Evidence |
| --- | --- | --- |
| Email/password auth, BCrypt, stateless JWT, protected routes | ✅ | `AuthController`, `AuthServiceImpl`, `SecurityConfig`, `RequireAuth` |
| PDF/DOCX upload (10 MB), server-side text extraction | ✅ | `ResumeParserService`, `PdfResumeParser`, `DocxResumeParser` |
| Résumé list/detail/delete, owner-scoped | ✅ | `ResumeController`, `ResumeServiceImpl` |
| Deterministic 7-dimension ATS score + feedback + recommendations | ✅ | `DeterministicAnalyzer`, `AnalysisController` |
| Dashboard stats, per-résumé and global history | ✅ | `DashboardController`, `AnalysisController` |
| Standard `ApiError` contract and validation | ✅ | `GlobalExceptionHandler`, `ApiError` |
| CI for both applications | ✅ | `.github/workflows/ci.yml` |
| Backend tests | ✅ 33 tests, 0 failures | `mvn -f backend/pom.xml clean verify` |
| Frontend tests + production build | ✅ 11 tests, build OK | `npm --prefix frontend test`, `npm run build` |
| Docker Compose: `db` (MySQL) + `backend` (Spring Boot) + `frontend` (nginx) | ✅ | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |
| E2E through nginx → API → MySQL (register, upload, analyse, history, isolation) | ✅ | Verification log §10 |

### 1.2 ATS correctness fixes shipped (2026-10-28)

The engine was audited end-to-end; these defects produced visibly wrong scores and are now fixed
with regression tests:

- [x] A technology list (`Java, Spring Boot`) was reported as a location because the location regex
      was case-insensitive; location is now a case-sensitive `City, Country`/`City, ST` contact line.
- [x] Any 10-digit number (employee id, reference) was reported as a phone; phones now need 9–15
      digits and a separator or country code.
- [x] `rawText.contains("bs")` matched "we**bs**ite", awarding +40 education; degrees are now matched
      as whole tokens (`BSc`, `B.S.`, `MS`, `Master`, `PhD`, …).
- [x] `C++` and `C#` were never detected (`\b` cannot follow `+`/`#`); symbol-safe boundaries are used.
- [x] `15+`/`20+` metrics were never counted and `4,000` was ignored; metric patterns now cover both.
- [x] Any sentence mentioning "projects"/"experience"/"skills" counted as a section; sections are
      now detected from short headings (or a `Label:` prefix).
- [x] "Newest first" list ordering was ambiguous for rows created in the same second (`uploaded_at`
      /`analyzed_at` have second precision); the queries now add `id DESC` as a tie-breaker.
- [x] Text is lower-cased with `Locale.ROOT`, so scoring does not depend on the server locale.

Dimension weights, response DTOs and endpoints are unchanged. Existing analyses keep their stored
scores until re-run.

---

## 2. Missing user-facing features

The sidebar routes below exist; the ones marked **Coming Soon** render a placeholder and have **no
backend API**.

| Route / screen | Current state | What is missing (P) |
| --- | --- | --- |
| `/`, `/auth`, `/dashboard`, `/cv`, `/cv/:id`, `/profile`, `/settings` | ✅ Working | — |
| `/cv/:id/edit` — CV editor | Coming Soon | Editable draft model, live ATS preview, summary/bullet rewriting, ATS-safe template, PDF export (P1) |
| `/jobs`, `/jobs/:id` — job catalog | Coming Soon | Companies/jobs tables + import, search/filter/pagination, job detail (P1) |
| `/companies`, `/companies/:slug` | Coming Soon | Company profiles, relationships to jobs (P1) |
| Job matching (inside job detail) | — | Deterministic skill/seniority/location match with matched/missing breakdown (P1) |
| `/applications` — application tracker | Coming Soon | Applications CRUD, status machine, timeline events, reminders, dashboard integration (P1) |
| `/job-description` — JD generator | Coming Soon | Deterministic JD templates + optional AI variant, save/export (P2) |
| `/prep`, `/prep/:planId` — interview prep | Coming Soon | Plans, tasks, question bank, practice tracking (P2) |
| `/roadmap` — learning roadmap | Coming Soon | Skill-gap analysis, curated resources, RAG retrieval, progress tracking (P2) |
| `/copilot` — AI career copilot | Coming Soon | Document ingestion, retrieval, grounded answers with citations (P2) |
| CV re-scan against a target role/job ad | — | Target-role/JD input on analyse, keyword modes, keyword panels (P0/P2) |
| Notifications / email | — | Transactional email service, verification, reminders (P1) |
| Billing / plan management | — | Plans, checkout, invoices, entitlement/quotas UI (P1) |

---

## 3. Remaining work checklist

### 3.1 ATS and analysis engine

- [ ] **(P0)** Replace coarse feedback with per-finding `severity`, `explanation`, `recommendation`,
      `dimension` and a stable finding `key` (additive columns; see roadmap Phase 2).
- [ ] **(P0)** Add grade bands (A–E) and a `grade`/`band` on the analysis response.
- [ ] **(P0)** Career-stage rules (student / intern / graduate / early-career) so "required" sections
      and years-of-experience expectations vary.
- [ ] **(P1)** Keyword analysis with three modes: general, target role, pasted job description;
      report matched/missing/bonus keywords without inventing them.
- [ ] **(P1)** Expand the skill taxonomy from ~45 to a categorised ~150-skill dictionary with aliases
      and categories, shared by the engine and job matching.
- [ ] **(P1)** Detect more contact/identity signals: full name, LinkedIn, portfolio, GitHub, city,
      country, work authorisation (without storing unnecessary personal data).
- [ ] **(P1)** Formatting checks that an ATS actually cares about: tables/columns, images-only text,
      header/footer content, non-standard headings, page count, fonts (where extractable).
- [ ] **(P2)** OCR fallback for image-only PDFs (explicitly labelled as OCR-derived).
- [ ] **(P2)** Peer benchmark ("your score is in the Nth percentile") only with an aggregated,
      consent-based dataset — otherwise do not ship.
- [ ] **(P0)** Load/robustness tests: 10 MB PDF, 500-page PDF, malformed DOCX, password-protected
      PDF must fail with a clear `ApiException`, never a 500 with a stack trace.

### 3.2 Parsing and CV management

- [ ] **(P0)** Structured parse model: contact block, sections, experience/education/project entries,
      bullet statistics, links, with a parsed-snapshot column.
- [ ] **(P1)** CV versioning: `version`, `is_current`, label, target role/JD, re-scan, score history.
- [ ] **(P1)** `.txt` upload (and reject legacy `.doc` with a clear message).
- [ ] **(P0)** File-upload hardening: magic-byte sniffing, decompression-bomb limits for DOCX, PDF
      page limits, malware scanning or at minimum an isolated parser process.
- [ ] **(P1)** Original-file storage (object storage) so users can download what they uploaded.
- [ ] **(P1)** Pagination on `GET /api/resumes` and `GET /api/analyses`; server-side sorting/filtering.
- [ ] **(P2)** Duplicate detection ("this looks like a version of an existing CV").

### 3.3 Career toolkit (deterministic first)

- [ ] **(P1)** Candidate profile: headline, target roles, locations, seniority, salary expectation,
      links, work preferences; completeness calculation.
- [ ] **(P1)** Companies + jobs catalog with seeded data and an importer; search and filters.
- [ ] **(P1)** Deterministic `JobMatcher` (skills 45, seniority 18, location 15, role 12, extras 10)
      with an explainable breakdown and missing-skill recommendations.
- [ ] **(P1)** Application tracker: create/update/delete applications, status state machine,
      timeline events, reminders, notes, links to a CV version and a job.
- [ ] **(P1)** CV editor + ATS-safe template + PDF export, with live engine preview.
- [ ] **(P1)** Career-readiness dashboard: CV 40% + profile 30% + pipeline 30%, next best action.
- [ ] **(P2)** Cover-letter generator (deterministic template, optional AI).
- [ ] **(P2)** Interview prep planner, question bank and practice history.
- [ ] **(P2)** Learning roadmap with curated resources, progress and citations.

### 3.4 AI features (P2, after deterministic foundations)

- [ ] Provider abstraction (`ChatClient`, `EmbeddingClient`) with an OpenAI-compatible adapter and a
      **local deterministic fallback** for every feature.
- [ ] Job-description generator; summary rewriting; interview prep; RAG roadmap; copilot chat.
- [ ] Chunking, embedding storage, bounded retrieval, citation grounding and output-schema validation.
- [ ] Async status machine (`queued → running → ready/failed`), retries, stale-run guard, idempotency.
- [ ] Prompt/version registry, evaluation fixtures, cost/token budgets and per-user rate limits.
- [ ] Safety: moderation, no PII/secrets in prompts or logs, explicit "AI-generated" labelling,
      configurable data-processing consent and an opt-out.
- [ ] Observability for model latency, failure rate, fallback rate and spend.

### 3.5 Accounts and SaaS platform

- [ ] **(P0)** Email verification and password reset (transactional email provider).
- [ ] **(P0)** Account deletion and data export (self-service, with confirmation).
- [ ] **(P1)** Refresh tokens / session revocation, logout-all, token rotation; short-lived access
      tokens. Today a stolen JWT is valid for 24 h with no revocation.
- [ ] **(P1)** OAuth sign-in (Google/LinkedIn) and optional MFA.
- [ ] **(P1)** Subscription plans, trials, entitlements and quotas (e.g. N scans/month), enforced
      server-side.
- [ ] **(P1)** Billing provider integration (checkout, webhooks, invoices, tax, dunning, refunds).
- [ ] **(P1)** Admin/support views with audited access, or a documented policy that support cannot
      read CVs.
- [ ] **(P2)** Teams/recruiter accounts and role-based access (only if the product targets B2B).
- [ ] **(P2)** In-app notifications, weekly digest emails, referral codes.

### 3.6 Security, privacy and compliance

- [ ] **(P0)** Require `JWT_SECRET` from the environment outside dev — remove the committed default.
- [ ] **(P0)** Scope CORS to configured origins; never `*` with credentials.
- [ ] **(P0)** Rate limiting on auth and upload endpoints (per IP and per account); brute-force
      lockout/backoff.
- [ ] **(P0)** Security headers and CSP at nginx; HSTS once TLS terminates; disable server tokens.
- [ ] **(P0)** TLS everywhere, HTTP→HTTPS redirect, secure cookies if cookies are introduced.
- [ ] **(P0)** Secrets management (vault/managed secrets), rotation, no credentials in Compose for
      production.
- [ ] **(P0)** Dependency and container scanning (Dependabot/Renovate, `npm audit`, OWASP dependency
      check, image scan), plus SAST.
- [ ] **(P1)** GDPR/CCPA: privacy policy, terms, cookie policy, consent, DSAR workflow, retention
      policy, processing records, sub-processor list, DPA.
- [ ] **(P1)** Audit log for authentication, export, deletion and support access.
- [ ] **(P1)** Encrypt personal data at rest; define backup encryption and access.
- [ ] **(P1)** Independent penetration test and remediation before paid launch.

### 3.7 Infrastructure and operations

- [x] **(P0)** Local/self-hosted Compose stack with healthchecks and a persisted database volume.
- [ ] **(P0)** Production hosting: managed MySQL, container hosting, TLS termination, DNS, CDN.
- [ ] **(P0)** Backup and restore: automated backups, off-site retention, quarterly restore drill,
      documented RPO/RTO.
- [ ] **(P0)** CI/CD: publish versioned images, scan them, deploy to staging then production with a
      rollback plan; run Flyway migrations as a controlled step.
- [ ] **(P1)** Observability: structured JSON logs, request IDs, metrics (latency, errors, scan
      duration), traces, dashboards and alerts (availability, 5xx, latency, DB saturation).
- [ ] **(P1)** External error tracking and uptime monitoring; status page.
- [ ] **(P1)** Health/readiness endpoints (Actuator or dedicated) for the platform load balancer.
- [ ] **(P1)** Resource limits, JVM sizing, connection-pool sizing and autoscaling rules.
- [ ] **(P1)** Staging environment with synthetic data; no production CVs in staging.
- [ ] **(P2)** Blue/green or canary releases; feature flags.

### 3.8 Testing and quality

- [ ] **(P0)** Integration tests with Testcontainers MySQL for repositories, migrations and the
      full analyse flow (today's backend suites are unit/characterisation only).
- [ ] **(P0)** End-to-end browser tests (Playwright) for register → upload → analyse → history.
- [ ] **(P0)** Fixture corpus: strong/weak/section-less CVs in PDF and DOCX, scanned PDF, malformed
      files, non-English text, RTL text.
- [ ] **(P1)** Frontend component tests for the report, upload and error states; accessibility checks.
- [ ] **(P1)** Coverage reporting and a minimum threshold in CI.
- [ ] **(P1)** Load test (k6/Gatling): concurrent uploads/analyses, p95 latency, DB limits.
- [ ] **(P1)** Cross-browser and responsive checks (Chrome, Firefox, Safari, mobile).
- [ ] **(P2)** Contract tests for API compatibility as the engine expands.

### 3.9 Documentation, analytics and support

- [ ] **(P1)** OpenAPI spec + Swagger UI (security permits the paths but no springdoc dependency exists).
- [ ] **(P1)** User help centre / onboarding tour / FAQ / sample CV.
- [ ] **(P1)** Changelog and release notes.
- [ ] **(P1)** Privacy-safe product analytics (activation, scans, conversion) and a retention dashboard.
- [ ] **(P1)** Support channel, SLA expectations and a runbook for common failures.
- [ ] **(P2)** Localisation/i18n (at least French/Arabic for the target market) including CV parsing.

---

## 4. Delivery milestones

### M0 — Containerised MVP (complete)

- [x] Deterministic ATS with corrected detectors and regression tests.
- [x] Auth, résumé management, dashboard and history.
- [x] One-command Compose deployment with healthchecks.
- **Exit criteria:** tests green, stack healthy, E2E flow verified (see §10).

### M1 — Production hardening (P0, next)

- [ ] Required secrets, scoped CORS, rate limiting, security headers, TLS.
- [ ] Integration and E2E tests, fixture corpus, upload hardening.
- [ ] Managed MySQL, backups/restore drill, staging, CI/CD and rollback.
- [ ] Logging, metrics, alerts, error tracking and health endpoints.
- [ ] Privacy policy, terms, account deletion/export, audit log.
- **Exit criteria:** a security review and a restore drill pass; no P0 item open; staging accepts a
  real user journey end-to-end.

### M2 — Deterministic career toolkit (P1)

- [ ] Structured parse, CV versioning, profile, catalog, job matching, applications, CV editor/PDF,
  readiness dashboard.
- **Exit criteria:** every journey works with no AI key configured; matching weights sum to 100 and
  are deterministic; existing ATS endpoints remain backward compatible.

### M3 — AI differentiation (P2)

- [ ] Provider abstraction + fallbacks, JD generator, interview prep, roadmap, copilot.
- **Exit criteria:** every AI feature returns a labelled deterministic result without a key; grounded
  citations resolve; model output is schema-validated; budgets and rate limits enforced.

### M4 — Commercial launch (P1)

- [ ] Billing, plans, trials, quotas, invoices/tax, dunning.
- [ ] Support tooling, help centre, status page, analytics, growth experiments.
- [ ] Legal/compliance sign-off and penetration test remediation.
- **Exit criteria:** a customer can subscribe, use the quota, cancel, export and delete data without
  human intervention.

---

## 5. Go-live checklist (run in order)

**Code and data**

- [ ] All P0 items above closed; tests, load test and accessibility checks green.
- [ ] Migrations reviewed and applied to a staging copy; rollback tested.
- [ ] Backup/restore drill completed within the last quarter; RPO/RTO documented.

**Security and legal**

- [ ] Secrets rotated and stored in a manager; dev defaults removed.
- [ ] TLS/HSTS, CORS allowlist, headers/CSP, rate limits verified from outside.
- [ ] Penetration test findings fixed; dependency/image scans clean.
- [ ] Privacy policy, terms, DPA, retention and DSAR flows live.

**Operations**

- [ ] Monitoring, alerting, on-call rotation and runbooks in place.
- [ ] Status page and incident communication plan ready.
- [ ] Cost budget and autoscaling limits configured.

**Commercial and support**

- [ ] Billing tested (success, failure, refund, tax), quotas enforced, invoices correct.
- [ ] Support inbox, help centre, onboarding emails and trial expiry behaviour verified.
- [ ] Analytics events validated and dashboards shared.

**Launch**

- [ ] Staging sign-off with the E2E suite and a manual smoke test.
- [ ] Production deploy, smoke test through the public URL, monitor for 24 h.
- [ ] Announce, watch activation/error dashboards, roll back if SLOs are breached.

---

## 6. Known limitations and deliberate decisions

| # | Limitation | Consequence / decision |
| --- | --- | --- |
| 1 | Only PDF and DOCX are accepted, no OCR | Image-only PDFs yield empty text; surfaced to the user, not silently scored. |
| 2 | Original files are not stored | Only extracted text is kept; download/regeneration is limited to text. |
| 3 | Analyses store a score snapshot | Changing detector rules affects only **new** scans; old rows keep their scores. |
| 4 | 7-dimension engine, coarse feedback | Explainable 10-dimension engine is M2/P0 per the roadmap. |
| 5 | AI is a no-op | No external model calls, no key required, no data leaves the deployment. |
| 6 | JWT is valid for 24 h with no revocation | Acceptable only until refresh tokens/session revocation land in M1. |
| 7 | Compose credentials are development defaults | Fine for local use; production must inject secrets. |
| 8 | No pagination or rate limits | Acceptable at MVP scale; both are P1 before public launch. |
| 9 | No billing, email or support tooling | Commercial launch (M4) requires them. |
| 10 | `analyser` package spelling differs from the artifact | Historical; preserved to avoid churn. |

---

## 7. Definition of done for the SaaS

A user can sign up, verify their email, upload a CV, receive an explainable and actionable ATS report,
track versions and applications, use the career tools, optionally subscribe, export or delete all of
their data, and receive support — with all of it running on hardened infrastructure with automated
tests, backups, monitoring and a documented incident process.

---

## 8. Verification log — 2026-10-28

Commands run from the repository root:

| Check | Command | Result |
| --- | --- | --- |
| Backend build/tests | `mvn -f backend/pom.xml clean verify` | BUILD SUCCESS — 33 tests, 0 failures |
| Frontend tests | `npm --prefix frontend test` | 11 tests, 0 failures |
| Frontend build | `npm --prefix frontend run build` | `tsc -b` + `vite build` succeeded |
| Compose config | `docker compose config` | valid: `db`, `backend`, `frontend` |
| Compose build/up | `docker compose up -d --build` | all images built; all three services healthy |
| Flyway on MySQL 8.0 | backend startup logs | 3 migrations applied, schema at `v3`, `ddl-auto: validate` passed |
| SPA + routing | `curl http://localhost:13000/` and `/cv/1` | 200 (history fallback works) |
| API proxy | `curl http://localhost:13000/api/dashboard/stats` | 401 (reaches Spring Security through nginx) |
| E2E ATS — strong DOCX | register → upload → analyse | overall **84**, ATS 100, skills 95, education 100 |
| E2E ATS — weak DOCX | upload → analyse | overall **24**, ATS 0, education 30, projects 30, skills 45 |
| E2E ATS — strong PDF | upload (PDFBox) → analyse | same scores as the DOCX |
| E2E — history/dashboard | list + stats | 3 résumés, 3 analyses, newest-first ids, best 84 |
| E2E — isolation | second user reads first user's résumé | 404 |
| E2E — invalid upload | `.txt` file | 400 `UNSUPPORTED_FILE_TYPE` |
| Container recreate | `docker compose up -d --force-recreate backend` | nginx kept proxying (dynamic DNS), DB data persisted |

> The local machine already used host port 8080 for another project, so the stack was exercised with
> `BACKEND_PORT=18080 FRONTEND_PORT=13000`. The defaults remain 8080/3000.
