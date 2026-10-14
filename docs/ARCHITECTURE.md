# CareerPilot — System Architecture

> **Reading guide.** Sections 1–10 describe the **architecture implemented today**. Section 11
> describes the **proposed target architecture** from
> [`CAREERPILOT_MIGRATION_PLAN.md`](../CAREERPILOT_MIGRATION_PLAN.md). Diagrams are labelled
> accordingly. Every "current" statement is verifiable at the source paths cited.

---

## 1. High-level architecture (current)

CareerPilot is a classic two-tier web application: an Angular single-page application talks to a
Spring Boot REST API over HTTP/JSON, and the API persists to a relational database through JPA. A
stateless JWT secures every endpoint except registration and login.

```mermaid
graph TD
    subgraph Client["Browser"]
        SPA["Angular 18 SPA<br/>(localhost:4200)"]
    end

    subgraph Server["Spring Boot 3.3.5 · Java 21 (localhost:8080)"]
        API["REST API /api/**"]
        SEC["Spring Security<br/>JWT filter chain"]
        SVC["Service layer"]
        ENGINE["DeterministicAnalyzer<br/>+ ResumeParserService"]
        REPO["Spring Data JPA<br/>repositories"]
    end

    DB[("H2 (dev, in-memory)<br/>MySQL (prod)")]
    AI["AI provider<br/>(interface only — no-op today)"]

    SPA -- "HTTP + JSON<br/>Authorization: Bearer JWT" --> API
    API --> SEC
    SEC --> SVC
    SVC --> ENGINE
    SVC --> REPO
    REPO -- "JDBC / Hibernate" --> DB
    SVC -. "AIAnalysisService<br/>(stub, returns deterministic result)" .-> AI
```

**Verified stack.**

| Layer | Technology | Evidence |
| --- | --- | --- |
| Backend language | Java 21 | `backend/pom.xml` `<java.version>21</java.version>` |
| Backend framework | Spring Boot 3.3.5 (web, data-jpa, security, validation) | `backend/pom.xml` |
| Build tool | Maven | `backend/pom.xml`, `Makefile` |
| Security | Spring Security 6 + JJWT 0.12.6 + BCrypt | `security/`, `config/SecurityConfig.java` |
| Persistence | Spring Data JPA / Hibernate | `repository/`, `entity/` |
| Databases | H2 (dev, in-memory, MySQL mode), MySQL (prod) | `application-dev.yml`, `application-prod.yml` |
| Schema migration | Flyway (`V1__initial_schema.sql`, `V2__baseline_constraints.sql`) | `resources/db/migration/` |
| PDF parsing | Apache PDFBox 3.0.3 | `parser/PdfResumeParser.java` |
| DOCX parsing | Apache POI 5.3.0 (`poi-ooxml`) | `parser/DocxResumeParser.java` |
| Boilerplate | Lombok | `backend/pom.xml` |
| Frontend | Angular 18.2 (standalone components), RxJS 7.8, SCSS | `frontend/package.json` |
| Frontend tests | Karma + Jasmine | `frontend/package.json`, `angular.json` |

---

## 2. Backend architecture (current)

The backend is a layered Spring Boot application rooted at the package `com.resumeanalyzer`.

```mermaid
graph TD
    subgraph Web["Controller layer"]
        AC["AuthController<br/>/api/auth"]
        RC["ResumeController<br/>/api/resumes"]
        ANC["AnalysisController<br/>/api + /api/analyses"]
        DC["DashboardController<br/>/api/dashboard"]
        UC["UserController<br/>/api/users"]
    end

    subgraph ServiceLayer["Service layer"]
        AS["AuthServiceImpl"]
        RS["ResumeServiceImpl"]
        ANS["AnalysisServiceImpl"]
        DS["DashboardServiceImpl"]
        US["UserServiceImpl"]
        PARSER["ResumeParserService (+ Pdf/Docx parsers)"]
        DET["DeterministicAnalyzer"]
        AIS["AIAnalysisService (interface)<br/>OpenAIAnalysisService (stub)"]
    end

    subgraph Data["Persistence layer"]
        UREPO["UserRepository"]
        RREPO["ResumeRepository"]
        AREPO["ResumeAnalysisRepository"]
        SREPO["ResumeSectionRepository"]
        RECREPO["RecommendationRepository"]
    end

    subgraph Domain["Entities"]
        U["User"]
        R["Resume"]
        RA["ResumeAnalysis"]
        RSec["ResumeSection"]
        REC["Recommendation"]
    end

    subgraph CrossCut["Cross-cutting"]
        SEC2["SecurityConfig + JwtAuthenticationFilter<br/>JwtTokenProvider + UserPrincipal"]
        EXC["GlobalExceptionHandler → ApiError"]
    end

    AC --> AS
    RC --> RS
    ANC --> ANS
    DC --> DS
    UC --> US
    AS --> UREPO
    RS --> RREPO
    RS --> PARSER
    RS --> AREPO
    ANS --> RREPO
    ANS --> AREPO
    ANS --> SREPO
    ANS --> RECREPO
    ANS --> PARSER
    ANS --> DET
    ANS --> AIS
    DS --> RREPO
    DS --> AREPO
    US --> UREPO
    RREPO --> R
    AREPO --> RA
    SREPO --> RSec
    RECREPO --> REC
    UREPO --> U
```

### 2.1 Packages and responsibility

| Package | Contents | Responsibility |
| --- | --- | --- |
| `controller/` | `AuthController`, `ResumeController`, `AnalysisController`, `DashboardController`, `UserController` | Thin HTTP layer; resolves the caller via `@AuthenticationPrincipal UserPrincipal` and delegates |
| `service/` + `service/impl/` | Auth, Resume, Analysis, Dashboard, User | Transactions, ownership checks, orchestration |
| `service/ai/` | `AIAnalysisService` (interface), `OpenAIAnalysisService` (stub) | Optional AI enhancement hook |
| `parser/` | `ResumeParserService`, `PdfResumeParser`, `DocxResumeParser`, `ParsedResume` | Text extraction + heuristic field/section parsing |
| `analyser/` | `DeterministicAnalyzer` | The 7-dimension scoring engine |
| `entity/` | `User`, `Resume`, `ResumeAnalysis`, `ResumeSection`, `Recommendation` | JPA domain model |
| `repository/` | 5 Spring Data repositories | Data access + custom `@Query` aggregations |
| `dto/` | `auth/`, `resume/`, `analysis/`, `dashboard/`, `user/` | Request/response payloads |
| `security/` | `JwtAuthenticationFilter`, `JwtTokenProvider`, `UserPrincipal`, `CustomUserDetailsService` | JWT issuance/validation and the security principal |
| `config/` | `SecurityConfig` | Filter chain, password encoder, CORS |
| `exception/` | `GlobalExceptionHandler` + typed exceptions | Map exceptions to `ApiError` |
| `common/` | `ApiError` | Shared error record |

> **Note on naming.** The package containing the scoring engine is spelled `analyser` (British) while
> the artifact/project name uses `analyzer`. Both spellings appear in the tree; this document matches
> the actual paths.

### 2.2 The scoring engine (`analyser/DeterministicAnalyzer.java`)

Seven dimensions, hard-coded weights summing to 1.00:

```mermaid
graph LR
    P["ParsedResume"] --> D1["ATS compatibility (0.20)"]
    P --> D2["Content quality (0.20)"]
    P --> D3["Skills (0.15)"]
    P --> D4["Experience (0.20)"]
    P --> D5["Education (0.10)"]
    P --> D6["Projects (0.10)"]
    P --> D7["Structure (0.05)"]
    D1 --> OA["overallScore = round(Σ score×weight)"]
    D2 --> OA
    D3 --> OA
    D4 --> OA
    D5 --> OA
    D6 --> OA
    D7 --> OA
    OA --> RA["ResumeAnalysis (7 score columns)"]
    OA --> SEC["7 × ResumeSection (feedback)"]
    OA --> REC["0..n Recommendation (priority)"]
```

Signals per dimension:

| Dimension | Weight | Signal |
| --- | --- | --- |
| ATS compatibility | 0.20 | email, phone, location, standard headings |
| Content quality | 0.20 | word count, action verbs, metrics |
| Skills | 0.15 | number of recognised skills |
| Experience | 0.20 | experience section + verbs + metrics |
| Education | 0.10 | education section + degree keywords |
| Projects | 0.10 | projects section + links |
| Structure | 0.05 | ≥4 sections, email+phone present |

### 2.3 The parser (`parser/ResumeParserService.java`)

- `extractRawText(MultipartFile)` dispatches on the filename extension to `PdfResumeParser`
  (PDFBox) or `DocxResumeParser` (POI). **Only `.pdf` and `.docx` are accepted**; anything else
  throws `UnsupportedFileTypeException`.
- `parseText(String)` performs regex-based extraction of email/phone/location, keyword-based section
  detection (`SUMMARY`, `EXPERIENCE`, `EDUCATION`, `SKILLS`, `PROJECTS`, `CERTIFICATIONS`,
  `LANGUAGES`), a fixed ~45-entry skill list, a fixed action-verb list, quantifiable-metric counting
  and word counting, producing a flat `ParsedResume`.

### 2.4 AI integration today

`AIAnalysisService.enhanceAnalysis(...)` is called by `AnalysisServiceImpl` between the deterministic
analysis and persistence. `OpenAIAnalysisService` **logs and returns the deterministic result
unchanged** — there is no HTTP call, no embeddings and no provider client. The `ai.*` configuration
keys exist in `application.yml` but are only read to log a message. **No AI processing is implemented.**

---

## 3. Frontend architecture (current)

Angular 18 with **standalone components** (no NgModules), the new functional `provideRouter` /
`provideHttpClient` bootstrap, and a feature-folder structure.

```mermaid
graph TD
    subgraph Core["core/"]
        GS["AuthService"]
        RSvc["ResumeService"]
        ASvc["AnalysisService"]
        DSvc["DashboardService"]
        USvc["UserService"]
        TSvc["ThemeService"]
        ToastSvc["ToastService"]
        JWTInt["jwtInterceptor (functional)"]
        AG["authGuard"]
        GG["guestGuard"]
        MODELS["models/ (auth, resume, analysis, dashboard, user)"]
    end

    subgraph Features["features/"]
        LOGIN["login / register"]
        DASH["dashboard"]
        RLIST["resume-list / resume-detail"]
        ALIST["analysis-list / analysis-detail"]
        RECS["recommendations"]
        PROF["profile / settings"]
        NF["not-found"]
    end

    subgraph Layout["layout/ + shared/"]
        ML["MainLayout (header, sidebar)"]
        UPM["resume-upload-modal"]
        SC["score-circle / score-bar / stat-card / toast"]
    end

    AppConfig["app.config.ts<br/>provideRouter + provideHttpClient(withInterceptors)"] --> JWTInt
    AppConfig --> Routes["app.routes.ts"]
    Routes --> LOGIN
    Routes --> ML
    ML --> DASH
    ML --> RLIST
    ML --> ALIST
    ML --> RECS
    ML --> PROF
    DASH --> DSvc
    DASH --> RSvc
    DASH --> ASvc
    RLIST --> RSvc
    RLIST --> ASvc
    ALIST --> ASvc
    RECS --> ASvc
    PROF --> USvc
    LOGIN --> GS
    LOGIN --> TSvc
    JWTInt --> GS
    AG --> GS
    GG --> GS
    RSvc --> MODELS
    ASvc --> MODELS
    DSvc --> MODELS
    USvc --> MODELS
    GS --> MODELS
```

### 3.1 Routes (from `app.routes.ts`)

```mermaid
graph TD
    Root["/"] --> Login["/login (guestGuard)"]
    Root --> Reg["/register (guestGuard)"]
    Root --> Layout["'' MainLayout (authGuard)"]
    Layout --> R1["'' → redirect /dashboard"]
    Layout --> R2["/dashboard"]
    Layout --> R3["/my-resumes"]
    Layout --> R4["/my-resumes/:id"]
    Layout --> R5["/analysis"]
    Layout --> R6["/analysis/:id"]
    Layout --> R7["/recommendations"]
    Layout --> R8["/profile"]
    Layout --> R9["/settings"]
    Root --> NF["** NotFound"]
```

### 3.2 Frontend services → backend endpoints

| Service | Methods | Endpoint(s) |
| --- | --- | --- |
| `AuthService` | `register`, `login` | `POST /api/auth/register`, `POST /api/auth/login` |
| `ResumeService` | `uploadResume(file)`, `getUserResumes()`, `getResumeDetail(id)`, `deleteResume(id)` | `/api/resumes*` |
| `AnalysisService` | `analyzeResume(id)`, `getResumeAnalyses(id)`, `getUserAnalysisHistory()`, `getAnalysisById(id)`, `deleteAnalysis(id)` | `/api/resumes/{id}/analyze`, `/api/analyses*` |
| `DashboardService` | `getStats()` | `GET /api/dashboard/stats` |
| `UserService` | `getCurrentUser()`, `updateProfile(req)` | `GET/PUT /api/users/me` |
| `ThemeService` | localStorage `app_theme`, `data-theme` attribute | n/a (client-only) |
| `ToastService` | transient UI messages | n/a (client-only) |

The API base URL is `environment.apiUrl` = `http://localhost:8080/api` (`src/environments/environment.ts`).

---

## 4. Frontend ↔ backend communication

```mermaid
sequenceDiagram
    autonumber
    participant C as Angular component
    participant S as Core service
    participant I as jwtInterceptor
    participant F as JwtAuthenticationFilter
    participant Sec as Spring Security
    participant Ctl as Controller
    participant Svc as Service
    participant DB as Repository / DB

    C->>S: call service method
    S->>I: HttpClient request
    I->>I: attach Authorization: Bearer <token><br/>(skipped for /auth/login and /auth/register)
    I->>F: HTTP request
    F->>F: validate token, load UserPrincipal
    F->>Sec: set SecurityContext
    Sec->>Ctl: authorize (authenticated) and dispatch
    Ctl->>Svc: delegate with userPrincipal.getId()
    Svc->>DB: owner-scoped query
    DB-->>Svc: entity
    Svc-->>Ctl: DTO
    Ctl-->>I: 200/201 JSON
    I-->>S: response (on 401: toast + logout)
    S-->>C: data
```

The interceptor (`core/interceptors/jwt.interceptor.ts`) attaches the bearer token and, on any
`401`, shows an error toast and logs the user out.

---

## 5. Authentication and authorization

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant UI as Angular
    participant A as AuthController
    participant AS as AuthServiceImpl
    participant AM as AuthenticationManager
    participant BC as BCryptPasswordEncoder
    participant TP as JwtTokenProvider
    participant DB as UserRepository

    U->>UI: submit credentials
    UI->>A: POST /api/auth/register {username,email,password}
    A->>AS: register(request)
    AS->>DB: existsByEmail / existsByUsername
    AS->>BC: encode(password)
    AS->>DB: save(new User)
    AS->>AM: authenticate(email,password)
    AM->>DB: findByEmail → CustomUserDetailsService
    AM->>BC: matches(raw, encoded)
    AS->>TP: generateToken(authentication)
    TP-->>AS: signed JWT (subject = userId)
    AS-->>A: AuthResponse {token, user}
    A-->>UI: 201 Created
    UI->>UI: store token+user in localStorage
```

```mermaid
sequenceDiagram
    autonumber
    participant UI as Angular
    participant F as JwtAuthenticationFilter
    participant TP as JwtTokenProvider
    participant CU as CustomUserDetailsService
    participant Ctl as Protected controller

    UI->>F: request with Authorization: Bearer <jwt>
    F->>TP: validateToken(jwt)
    alt token valid
        F->>TP: getUserIdFromJWT(jwt)
        F->>CU: loadUserById(userId)
        CU-->>F: UserPrincipal (ROLE_USER)
        F->>F: SecurityContext.setAuthentication(...)
        F->>Ctl: proceed (authenticated)
    else token missing/invalid
        F->>Ctl: proceed unauthenticated → 401 via HttpStatusEntryPoint
    end
```

**Authorization model (current).**

- Authentication is **stateless** (`SessionCreationPolicy.STATELESS`), CSRF disabled (the API is
  bearer-token based).
- Permit-all paths: `/api/auth/**`, `/error`, `/v3/api-docs/**`, `/swagger-ui/**`,
  `/swagger-ui.html`. Everything else requires authentication.
- There is **no role system in use**: every user is granted the single authority `ROLE_USER`
  (`UserPrincipal.create`). `@EnableMethodSecurity` is enabled but no method-level rules are applied.
- **Authorization is enforced in the service layer** via owner-scoped repository queries
  (`findByIdAndUserId`, `findByIdAndResumeUserId`, `findByResumeUserIdOrderByAnalyzedAtDesc`), not by
  URL-pattern rules per resource.

> **Known risks (see §12):** `SecurityConfig` sets `allowedOriginPatterns("*")` together with
> `allowCredentials(true)`, and `application.yml` ships a hard-coded default JWT secret. The
> migration plan schedules both for hardening in Phase 14.

---

## 6. Database and storage

- **Technology:** a single relational database accessed through JPA/Hibernate.
  - **dev** (`application-dev.yml`): in-memory **H2** in MySQL compatibility mode
    (`jdbc:h2:mem:resume_db;DB_CLOSE_DELAY=-1;MODE=MySQL`), `ddl-auto: update`, H2 console enabled.
  - **prod** (`application-prod.yml`): **MySQL** (`jdbc:mysql://mysql:3306/resume_analyzer_db…`),
    `ddl-auto: validate`, Flyway enabled with `baseline-on-migrate: true`.
- **Schema migrations:** Flyway scripts in `backend/src/main/resources/db/migration/`. `V1` creates
  the five tables; `V2` adds baseline indexes. In the dev profile Flyway is not explicitly enabled in
  the YAML, so H2 schema is primarily driven by `ddl-auto: update`.
- **File storage:** there is **no external object store.** Uploaded files are not persisted; only the
  **extracted text** is stored in `resumes.extracted_text` (`LONGTEXT`). The original document is read
  in-memory during upload and discarded.

Full details, columns and the ERD are in [`DATABASE.md`](DATABASE.md).

---

## 7. External services and integrations

| Integration | Status |
| --- | --- |
| AI / LLM provider | **Interface only** — `AIAnalysisService` + `OpenAIAnalysisService` stub; no external calls. `ai.*` config keys exist but unused. |
| PDF/DOCX parsing libraries | In-process (PDFBox, POI) — not remote services. |
| OpenAPI/Swagger UI | **Not present.** `SecurityConfig` permits `/swagger-ui/**` and `/v3/api-docs/**`, but no dependency provides them (no springdoc). |
| Email, payments, object storage, analytics | None. |

---

## 8. Error handling, validation, logging and security

### 8.1 Error contract

All failures return the shared `ApiError` record
(`common/ApiError.java`):

```json
{
  "timestamp": "2026-10-14T03:36:25.123",
  "status": 404,
  "error": "Not Found",
  "code": "RESOURCE_NOT_FOUND",
  "message": "Resume not found or access denied",
  "path": "/api/resumes/42"
}
```

`GlobalExceptionHandler` maps:

| Exception | HTTP status | `code` |
| --- | --- | --- |
| `ResourceNotFoundException` | 404 | `RESOURCE_NOT_FOUND` |
| `BadRequestException` | 400 | `BAD_REQUEST` |
| `DuplicateResourceException` | 409 | `DUPLICATE_RESOURCE` |
| `UnsupportedFileTypeException` | 400 | `UNSUPPORTED_FILE_TYPE` |
| `UnauthorizedException` | 401 | `UNAUTHORIZED` |
| `BadCredentialsException` | 401 | `INVALID_CREDENTIALS` |
| `MaxUploadSizeExceededException` | 400 | `FILE_TOO_LARGE` |
| `MethodArgumentNotValidException` | 400 | `VALIDATION_ERROR` |
| any other `Exception` | 500 | `INTERNAL_ERROR` |

```mermaid
flowchart TD
    REQ["Incoming request"] --> CTRL["Controller"]
    CTRL -->|validation fails| V["MethodArgumentNotValidException"]
    CTRL --> SVC["Service"]
    SVC -->|not found / denied| NF["ResourceNotFoundException"]
    SVC -->|bad input| BR["BadRequestException"]
    SVC -->|duplicate| DUP["DuplicateResourceException"]
    V --> H["GlobalExceptionHandler"]
    NF --> H
    BR --> H
    DUP --> H
    H --> ERR["ApiError {code,message,...}"]
```

### 8.2 Validation
Jakarta Bean Validation annotations on request DTOs (`RegisterRequest`, `LoginRequest`,
`UpdateProfileRequest`) with `@Valid` on controller parameters. File type/size validation is implicit
via the extension check in `ResumeParserService` and the multipart limit (10 MB) in `application.yml`.

### 8.3 Logging
Spring Boot default logging via SLF4J; `@Slf4j` is used in `OpenAIAnalysisService`. `show-sql` is
`false` in both profiles. No structured/audit logging or request tracing is configured.

### 8.4 Security summary
- Passwords hashed with BCrypt.
- JWT signed with HMAC-SHA256; the secret is decoded from Base64 (with a UTF-8 fallback and 32-byte
  padding).
- CORS: all origins, all common methods, `allowCredentials(true)` — see §12.
- No rate limiting, no refresh tokens, no account lockout, no audit log.

---

## 9. Deployment architecture (current)

There is **no deployment pipeline in the repository** — no Dockerfile, no docker-compose and no deploy
workflow. What exists is a **CI** workflow (`.github/workflows/ci.yml`) that builds/tests both apps,
plus a `Makefile` for local runs. The production datasource defaults (`jdbc:mysql://mysql:3306/…`)
imply a container/Compose topology is intended but is not committed.

```mermaid
graph TD
    subgraph Dev["Developer machine"]
        NPM["npm --prefix frontend start<br/>Angular dev server :4200"]
        MVN["mvn -f backend/pom.xml spring-boot:run<br/>Spring Boot :8080"]
        H2[("H2 in-memory")]
    end
    NPM -- "http://localhost:8080/api" --> MVN
    MVN --> H2

    subgraph CI["GitHub Actions (ci.yml)"]
        JB["job: backend → mvn clean verify"]
        JF["job: frontend → npm ci && npm run build"]
    end

    subgraph ProdTarget["Implied production topology (not committed)"]
        FE["Static Angular build"]
        BE["Spring Boot container"]
        DB[("MySQL")]
        FE --> BE --> DB
    end
```

---

## 10. Testing architecture (current)

```mermaid
graph LR
    subgraph Backend["backend/src/test"]
        T1["AuthServiceTest"]
        T2["AuthControllerTest (@WebMvcTest)"]
        T3["GlobalExceptionHandlerTest"]
        T4["ResumeParserServiceTest<br/>(characterisation)"]
        T5["DeterministicAnalyzerTest<br/>(characterisation)"]
        FX["fixtures/strong-cv.txt, weak-cv.txt"]
    end
    subgraph Frontend["frontend/src"]
        F1["app.component.spec.ts"]
    end
```

- Backend: **26 tests**, all green (`mvn -f backend/pom.xml clean verify`).
- Frontend: **1 spec** (`app.component.spec.ts`).
- The parser and analyser tests are *characterisation* tests added in Phase 0 to pin the current
  behaviour before it is refactored.

---

## 11. Proposed target architecture (from the migration plan)

> **Everything in this section is proposed, not implemented.** It is reproduced from
> [`CAREERPILOT_MIGRATION_PLAN.md`](../CAREERPILOT_MIGRATION_PLAN.md) §4.

The target is a **modular monolith**: one Spring Boot deployable, package-by-feature, each domain
module owning its entities, repositories, services, controllers and pure engines. Deterministic
engines are added first; AI-dependent layers last, always behind an interface with an offline fallback.

```mermaid
graph TD
    SPA["Angular SPA<br/>dashboard · my-cv · cv-editor · jobs<br/>applications · profile · prep · roadmap · copilot"]
    API["Spring Boot 3 REST API /api<br/>security(JWT) · error contract · validation"]
    CTRL["Controllers → Services (tx, ownership, orchestration)"]
    ENG["Pure deterministic engines<br/>AtsEngine · JobMatcher · CvImprover<br/>InterviewPlanner · SkillGap · Retrieval · Grounding"]
    AIABS["AI abstraction (ai/)<br/>ChatClient / EmbeddingClient<br/>→ OpenAI-compatible HTTP<br/>→ LocalHashEmbedder + template fallbacks"]

    DB[("MySQL (prod) / H2 (dev)<br/>users · resumes(+version) · resume_analyses<br/>resume_sections · recommendations · resume_drafts<br/>profiles · companies · jobs · applications<br/>application_events · interview_* · learning_*<br/>resource_chunks · roadmaps · roadmap_items · copilot_*")]

    SPA --> API --> CTRL
    CTRL --> ENG
    CTRL --> AIABS
    CTRL --> DB
    ENG --> DB
```

### 11.1 Proposed package layout (from the plan §4.1)

```
com.resumeanalyzer
├── config/            SecurityConfig, CorsConfig, AsyncConfig, OpenApiConfig
├── security/          JWT filter, provider, UserPrincipal, CustomUserDetailsService
├── common/            ApiError, GlobalExceptionHandler, paging, clock
├── analysis/          engine (AtsEngine, dimensions, KeywordAnalyzer, GradeCalculator),
│                      TaxonomyService, CareerStageRules + controller/service/repository/dto
├── cv/                parser (…, TxtResumeParser), editor (CvImprover),
│                      template (AtsTemplateBuilder, PdfExporter) + controller/service/entity/dto
├── profile/           CandidateProfile + service/controller/dto
├── catalog/           Company, Job + seeded importer + search
├── matching/          JobMatcher (pure) + MatchController
├── application/       JobApplication, ApplicationEvent + state machine
├── interview/         InterviewPlan, PrepTask, InterviewQuestion, QuestionPractice + InterviewPlanner
├── roadmap/           SkillGapAnalyzer, LearningResource, ResourceChunk, Roadmap, RoadmapItem
│   └── rag/           Chunker, EmbeddingClient, Retrieval, RoadmapPrompt, Grounding
├── copilot/           CopilotDocument, CopilotChunk, Conversation, Message + Retrieval + Grounding
├── ai/                ChatClient, EmbeddingClient + OpenAiCompatibleClient + LocalHashEmbedder
└── dashboard/         readiness aggregation (extends DashboardService)
```

### 11.2 Proposed layering rules (from the plan §4.2)

- **Engines are pure** — no Spring, no JPA, no network — so they are unit-testable and deterministic.
- **Services orchestrate** transactions, ownership and persistence; they call engines and (only when
  configured) AI clients.
- **Controllers are thin and authenticated**, resolving the caller from the JWT `UserPrincipal`.
- **AI is behind interfaces** with deterministic fallbacks; nothing else may depend on a concrete
  provider.

### 11.3 Current vs target — key differences

| Concern | Current | Proposed target |
| --- | --- | --- |
| Scoring | 7 dimensions, coarse feedback | 10 explainable dimensions, severity/explanation/recommendation, grades, keyword modes |
| Parsing | regex, flat model, PDF/DOCX | structured model, ~150-skill taxonomy, TXT |
| CV model | one row per upload | versioned (`version`, `isCurrent`, target role/job ad, parsed snapshot) |
| Recommendations | rows tied to one analysis | persistent, status-tracked, stable key across re-scans |
| Catalog/matching/applications/interview/roadmap/copilot | none | new domain modules |
| AI | no-op stub | provider abstraction + embeddings + deterministic fallbacks |
| Vector storage | none | embeddings stored in MySQL (`LONGTEXT`) with a `model` column, ranked in-process |
| Async generation | none | entity status machine (`analyzing → generating → ready/failed`) + `@Async` executor + stale-run guard |
| Security | CORS `*` with credentials; default JWT secret | environment-scoped CORS; required `JWT_SECRET` outside dev |

---

## 12. Known limitations and architectural risks (current)

| # | Observation | Impact | Notes |
| --- | --- | --- | --- |
| 1 | `allowedOriginPatterns("*")` + `allowCredentials(true)` in `SecurityConfig` | Permissive CORS | Scheduled for hardening (plan Phase 14) |
| 2 | Hard-coded default JWT secret in `application.yml` | Token forgery if unchanged in prod | Scheduled for hardening |
| 3 | `OpenAIAnalysisService` is a no-op stub | No AI capabilities despite config keys | Intentional; AI is P2 |
| 4 | No object storage — original file discarded | No CV download/re-download | Plan keeps DB-stored text; storage optional (P2) |
| 5 | Flyway only explicitly enabled in prod profile; dev relies on `ddl-auto: update` | Dev/prod schema drift risk | `V2` is written to be valid on both H2 (MySQL mode) and MySQL |
| 6 | Frontend test coverage is one spec | Regressions in feature code can slip | Plan adds Karma/Jasmine tests with new modules |
| 7 | No pagination on list endpoints | Unbounded response size at scale | Acceptable at current scale |
| 8 | Stray `backend/src/java/com/resumeanalyzer/ResumeAnalyzerApplication.java` (identical duplicate outside the Maven source root) | Confusing; ignored by the build | Housekeeping candidate (see `commit.txt`) |
| 9 | `analyser` vs `analyzer` package spelling | Minor inconsistency | Preserved to avoid churn |
| 10 | No Dockerfile / deploy pipeline committed | Deployment steps undocumented | Documented as a gap in [`DEVELOPMENT.md`](DEVELOPMENT.md) |
