# CareerPilot — UML Diagrams

> **Legend.**
> **Implemented** = backed by current source code.
> **Proposed** = from [`CAREERPILOT_MIGRATION_PLAN.md`](../CAREERPILOT_MIGRATION_PLAN.md), not yet built.
> Diagrams use [Mermaid](https://mermaid.js.org/) syntax and render on GitHub.

---

## 1. Use case diagram

### 1.1 Implemented use cases

```mermaid
graph LR
    Visitor(("Visitor"))
    User(("Registered user"))

    subgraph CareerPilot["CareerPilot (implemented)"]
        UC1["Register account"]
        UC2["Log in"]
        UC3["Upload résumé (PDF/DOCX)"]
        UC4["View résumé list & detail"]
        UC5["Delete résumé"]
        UC6["Run ATS analysis"]
        UC7["View analysis report"]
        UC8["Browse analysis history"]
        UC9["View aggregated recommendations"]
        UC10["View dashboard stats"]
        UC11["View / update profile"]
        UC12["Toggle theme"]
    end

    Visitor --> UC1
    Visitor --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10
    User --> UC11
    User --> UC12

    UC3 -. "«include»" .-> UC_AUTH["JWT authentication"]
    UC6 -. "«include»" .-> UC_AUTH
    UC4 -. "«include»" .-> UC6
```

### 1.2 Proposed use cases (target)

```mermaid
graph LR
    User(("Registered user"))

    subgraph Target["Proposed (migration roadmap)"]
        P1["Re-scan CV against a target role / job ad"]
        P2["Manage CV versions (rename, set current)"]
        P3["Work through recommendations (mark done/dismissed)"]
        P4["Maintain candidate profile"]
        P5["Search companies & jobs"]
        P6["Match CV/profile to a job"]
        P7["Track job applications"]
        P8["Edit CV & export ATS PDF"]
        P9["Generate a job description"]
        P10["Plan interview preparation"]
        P11["Follow a learning roadmap"]
        P12["Chat with the AI Career Copilot"]
    end

    User --> P1
    User --> P2
    User --> P3
    User --> P4
    User --> P5
    User --> P6
    User --> P7
    User --> P8
    User --> P9
    User --> P10
    User --> P11
    User --> P12

    P6 -. "uses" .-> P4
    P8 -. "uses" .-> P3
    P12 -. "uses" .-> P2
    P11 -. "uses" .-> P4
```

---

## 2. Class diagrams

### 2.1 Domain entities (implemented)

```mermaid
classDiagram
    class User {
        +Long id
        +String username
        +String email
        +String password
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class Resume {
        +Long id
        +User user
        +String originalFilename
        +String fileType
        +Long fileSize
        +String extractedText
        +LocalDateTime uploadedAt
        +LocalDateTime updatedAt
        +List~ResumeAnalysis~ analyses
    }

    class ResumeAnalysis {
        +Long id
        +Resume resume
        +Integer overallScore
        +Integer atsScore
        +Integer contentScore
        +Integer structureScore
        +Integer skillsScore
        +Integer experienceScore
        +Integer educationScore
        +Integer projectsScore
        +LocalDateTime analyzedAt
        +List~ResumeSection~ sections
        +List~Recommendation~ recommendations
    }

    class ResumeSection {
        +Long id
        +ResumeAnalysis analysis
        +String sectionType
        +Integer score
        +String feedback
    }

    class Recommendation {
        +Long id
        +ResumeAnalysis analysis
        +String category
        +String priority
        +String message
    }

    User "1" --> "0..*" Resume : owns
    Resume "1" --> "0..*" ResumeAnalysis : has
    ResumeAnalysis "1" --> "0..*" ResumeSection : produces
    ResumeAnalysis "1" --> "0..*" Recommendation : produces
```

### 2.2 Supporting and engine classes (implemented)

```mermaid
classDiagram
    class ParsedResume {
        +String email
        +String phone
        +String location
        +String summary
        +List~String~ skills
        +String experienceText
        +String educationText
        +String projectsText
        +List~String~ certifications
        +List~String~ languages
        +List~String~ actionVerbsFound
        +int wordCount
        +int quantifiableMetricCount
        +String rawText
        +Set~String~ detectedSections
    }

    class ResumeParserService {
        +String extractRawText(MultipartFile file)
        +ParsedResume parseText(String rawText)
    }

    class PdfResumeParser {
        +String extractText(InputStream in)
    }

    class DocxResumeParser {
        +String extractText(InputStream in)
    }

    class DeterministicAnalyzer {
        +AnalysisResult analyze(ParsedResume parsed)
    }

    class AnalysisResult {
        +ResumeAnalysis analysis
        +List~ResumeSection~ sections
        +List~Recommendation~ recommendations
    }

    class AIAnalysisService {
        <<interface>>
        +AnalysisResult enhanceAnalysis(ParsedResume, AnalysisResult)
    }

    class OpenAIAnalysisService {
        +AnalysisResult enhanceAnalysis(ParsedResume, AnalysisResult)
    }

    ResumeParserService --> PdfResumeParser
    ResumeParserService --> DocxResumeParser
    ResumeParserService --> ParsedResume
    DeterministicAnalyzer --> ParsedResume
    DeterministicAnalyzer --> AnalysisResult
    AIAnalysisService <|.. OpenAIAnalysisService
    AnalysisResult --> ResumeAnalysis
```

### 2.3 Proposed domain model (target — not implemented)

```mermaid
classDiagram
    class CandidateProfile {
        +Long id
        +User user
        +String headline
        +String targetRole
        +String careerGoal
        +Integer yearsExperience
        +String workMode
        +List~String~ skills
    }
    class ResumeVersion {
        +Long id
        +int version
        +boolean isCurrent
        +String targetRole
        +String jobDescription
        +String parsedSnapshot
        +Integer score
        +String grade
    }
    class Company {
        +Long id
        +String slug
        +String name
    }
    class Job {
        +Long id
        +Company company
        +String title
        +String description
    }
    class JobApplication {
        +Long id
        +User user
        +Job job
        +String status
    }
    class ApplicationEvent {
        +Long id
        +JobApplication application
        +String fromStatus
        +String toStatus
    }
    class Roadmap {
        +Long id
        +User user
        +String status
    }
    class RoadmapItem {
        +Long id
        +Roadmap roadmap
        +String title
    }
    class CopilotConversation {
        +Long id
        +User user
    }
    class CopilotMessage {
        +Long id
        +CopilotConversation conversation
        +String role
        +String content
    }
    User "1" --> "0..1" CandidateProfile
    User "1" --> "0..*" ResumeVersion
    User "1" --> "0..*" JobApplication
    Company "1" --> "0..*" Job
    Job "1" --> "0..*" JobApplication
    JobApplication "1" --> "0..*" ApplicationEvent
    User "1" --> "0..*" Roadmap
    Roadmap "1" --> "0..*" RoadmapItem
    User "1" --> "0..*" CopilotConversation
    CopilotConversation "1" --> "0..*" CopilotMessage
```

---

## 3. Sequence diagrams

### 3.1 Registration & login (implemented)

See [`ARCHITECTURE.md` §5](ARCHITECTURE.md#5-authentication-and-authorization) for the detailed
registration and JWT-validation sequences.

### 3.2 Upload → parse → analyse (implemented — the core ATS workflow)

```mermaid
sequenceDiagram
    autonumber
    participant UI as React page
    participant RC as ResumeController
    participant RSvc as ResumeServiceImpl
    participant PS as ResumeParserService
    participant Doc as Pdf/Docx parser
    participant DB as Repositories
    participant AC as AnalysisController
    participant ASvc as AnalysisServiceImpl
    participant Det as DeterministicAnalyzer
    participant AI as AIAnalysisService (stub)

    UI->>RC: POST /api/resumes/upload (multipart)
    RC->>RSvc: uploadResume(userId, file)
    RSvc->>RSvc: reject empty file
    RSvc->>PS: extractRawText(file)
    PS->>Doc: dispatch on extension (.pdf/.docx)
    Doc-->>PS: raw text
    PS-->>RSvc: raw text
    RSvc->>DB: save(Resume{extractedText})
    RSvc-->>RC: ResumeDto (201)
    RC-->>UI: ResumeDto

    UI->>AC: POST /api/resumes/{id}/analyze
    AC->>ASvc: analyzeResume(resumeId, userId)
    ASvc->>DB: findByIdAndUserId(resumeId, userId)
    ASvc->>PS: parseText(resume.extractedText)
    PS-->>ASvc: ParsedResume
    ASvc->>Det: analyze(parsed)
    Det-->>ASvc: AnalysisResult (analysis + sections + recommendations)
    ASvc->>AI: enhanceAnalysis(parsed, result)
    AI-->>ASvc: result unchanged (no-op)
    ASvc->>DB: save analysis, sections, recommendations
    ASvc-->>AC: ResumeAnalysisDto (201)
    AC-->>UI: ResumeAnalysisDto
    UI->>UI: navigate to /analysis/:id
```

### 3.3 View dashboard (implemented)

```mermaid
sequenceDiagram
    autonumber
    participant UI as DashboardComponent
    participant DS as DashboardService (FE)
    participant RS as ResumeService (FE)
    participant AS as AnalysisService (FE)
    participant DC as DashboardController
    participant RC as ResumeController
    participant AC as AnalysisController
    participant DB as Repositories

    UI->>DS: getStats()
    DS->>DC: GET /api/dashboard/stats
    DC->>DB: countByUserId, countByResumeUserId, AVG, MAX
    DC-->>DS: DashboardStatsDto
    UI->>RS: getUserResumes()
    RS->>RC: GET /api/resumes
    RC-->>RS: Resume[] (with latestScore)
    UI->>AS: getUserAnalysisHistory()
    AS->>AC: GET /api/analyses
    AC-->>AS: ResumeAnalysis[]
    UI->>UI: render stats, 5 recent résumés, 5 recent analyses
```

### 3.4 Proposed: CV re-scan with a target role (target)

```mermaid
sequenceDiagram
    autonumber
    participant UI as React page
    participant Ctl as ResumeController (proposed)
    participant Svc as ResumeService (proposed)
    participant Eng as AtsEngine (proposed)
    participant DB as Repositories

    UI->>Ctl: POST /api/resumes/{id}/reanalyze {targetRole, jobDescription}
    Ctl->>Svc: reanalyze(id, userId, target)
    Svc->>DB: load current version (owner-scoped)
    Svc->>Eng: analyze(parsedSnapshot, target)
    Eng-->>Svc: AtsAnalysis (10 dims, issues, keywords, grade)
    Svc->>DB: append analysis + update denormalised score/grade
    Svc-->>Ctl: analysis view
    Ctl-->>UI: 200
```

### 3.5 Proposed: grounded AI Career Copilot answer (target)

```mermaid
sequenceDiagram
    autonumber
    participant UI as React page
    participant Ctl as CopilotController (proposed)
    participant R as Retrieval (proposed)
    participant E as EmbeddingClient (proposed)
    participant Chat as ChatClient (proposed)
    participant G as CitationGrounder (proposed)
    participant DB as Repositories

    UI->>Ctl: POST /api/copilot/chat {conversationId, message}
    Ctl->>R: retrieve(message, candidate chunks)
    R->>E: embed(message) (gateway or local hash fallback)
    E-->>R: query vector
    R-->>Ctl: top-k bounded passages
    alt AI configured
        Ctl->>Chat: grounded prompt + passages
        Chat-->>Ctl: draft answer + citations
        Ctl->>G: validate citations resolve to passages
        G-->>Ctl: grounded answer (or downgraded confidence)
    else no key
        Ctl->>Ctl: deterministic verbatim-extract fallback
    end
    Ctl->>DB: persist message + answer
    Ctl-->>UI: grounded answer with citations
```

---

## 4. Activity diagrams

### 4.1 ATS analysis workflow (implemented)

```mermaid
flowchart TD
    Start(["User selects a résumé"]) --> Uploaded{"Already uploaded?"}
    Uploaded -- "No" --> Upload["Upload PDF/DOCX"]
    Upload --> Valid{"Extension allowed<br/>and non-empty?"}
    Valid -- "No" --> ErrType["400 UNSUPPORTED_FILE_TYPE / BAD_REQUEST"]
    Valid -- "Yes" --> Extract["Extract raw text"]
    Extract --> Own{"Résumé owned<br/>by caller?"}
    Uploaded -- "Yes" --> Own
    Own -- "No" --> Err404["404 RESOURCE_NOT_FOUND"]
    Own -- "Yes" --> Parse["parseText → ParsedResume"]
    Parse --> Score["DeterministicAnalyzer.analyze"]
    Score --> Enhance["AIAnalysisService.enhanceAnalysis (no-op)"]
    Enhance --> Persist["Persist analysis + sections + recommendations"]
    Persist --> Report["Return ResumeAnalysisDto"]
    Report --> View["User views report / history"]
    View --> End(["Done"])
```

### 4.2 Authentication gate on every protected request (implemented)

```mermaid
flowchart TD
    Req(["HTTP request"]) --> IsAuth{"Path under<br/>/api/auth/** or /error<br/>or swagger?"}
    IsAuth -- "Yes" --> Allow["Permit all"]
    IsAuth -- "No" --> HasToken{"Bearer token<br/>present?"}
    HasToken -- "No" --> E401["401 Unauthorized"]
    HasToken -- "Yes" --> Valid{"Token valid<br/>(signature + expiry)?"}
    Valid -- "No" --> E401
    Valid -- "Yes" --> Load["Load UserPrincipal (ROLE_USER)"]
    Load --> Scope["Service enforces ownership by userId"]
    Scope --> Ok["200/201 response"]
```

### 4.3 Proposed: roadmap generation with fallback (target)

```mermaid
flowchart TD
    Start(["POST /api/roadmaps/{id}/generate"]) --> Status["Set status = generating"]
    Status --> Gap["SkillGapAnalyzer (deterministic)"]
    Gap --> Key{"AI key configured?"}
    Key -- "Yes" --> LLM["Call ChatClient with strict prompt"]
    LLM --> Schema{"Output passes schema<br/>validation?"}
    Schema -- "No" --> Template["Template roadmap generator"]
    Schema -- "Yes" --> Ground["Ground resources to catalogue"]
    Ground --> GroundOk{"All resources resolve?"}
    GroundOk -- "No" --> Template
    GroundOk -- "Yes" --> Ready["Set status = ready"]
    Key -- "No" --> Template
    Template --> Ready
    Ready --> End(["Client polls / re-fetches"])
```

---

## 5. Component diagram (implemented)

```mermaid
graph TD
    subgraph Frontend["React app"]
        F_Router["Router + Guards"]
        F_Intercept["JWT Interceptor"]
        F_Services["Core services"]
        F_Features["Feature components"]
        F_Shared["Shared components"]
    end

    subgraph Backend["Spring Boot app"]
        B_Web["Web layer (controllers)"]
        B_Sec["Security (filter, provider, principal)"]
        B_Srv["Services"]
        B_Eng["Parser + DeterministicAnalyzer + AI stub"]
        B_Pers["Repositories (Spring Data JPA)"]
        B_Err["GlobalExceptionHandler / ApiError"]
    end

    DB[("H2 / MySQL")]

    F_Features --> F_Services
    F_Router --> F_Features
    F_Intercept --> F_Services
    F_Services -- "HTTP/JSON" --> B_Sec
    B_Sec --> B_Web
    B_Web --> B_Srv
    B_Web --> B_Err
    B_Srv --> B_Eng
    B_Srv --> B_Pers
    B_Eng --> B_Pers
    B_Pers --> DB
```

---

## 6. Deployment diagram

### 6.1 Implemented (local development + CI)

```mermaid
graph TD
    subgraph DevMachine["Developer machine"]
        FE["«artifact» Vite dev server<br/>:5173"]
        BE["«artifact» Spring Boot<br/>:8080"]
        H2[("«database» H2<br/>in-memory")]
    end
    FE -- "HTTP/JSON :8080/api" --> BE
    BE -- "JDBC" --> H2

    subgraph CI["CI (GitHub Actions)"]
        CI_B["«job» backend: mvn clean verify"]
        CI_F["«job» frontend: npm ci + npm test + npm run build"]
    end
```

### 6.2 Implemented Docker Compose stack

```mermaid
graph TD
    subgraph Compose["docker compose up (project: careerpilot)"]
        FE["«container» frontend<br/>nginx:1.27-alpine<br/>:80 → host :3000"]
        BE["«container» backend<br/>Spring Boot 3.3.5 / Java 21<br/>:8080 → host :8080"]
        DB[("«container» db<br/>MySQL 8.0<br/>volume careerpilot-db")]
    end

    Browser["Browser"] -- "SPA + /api/*" --> FE
    FE -- "proxy_pass http://backend:8080" --> BE
    BE -- "JDBC / Hibernate<br/>prod profile + Flyway" --> DB
```

- The **frontend** image is a multi-stage build (`node:22-alpine` → `nginx:1.27-alpine`). nginx serves
  the SPA with history fallback, caches hashed assets, raises `client_max_body_size` to 10 MB and
  proxies `/api/` to `http://backend:8080`, so the browser uses one origin.
- The **backend** image is a multi-stage build (`maven:3.9-eclipse-temurin-21` →
  `eclipse-temurin:21-jre-alpine`). It runs the packaged jar as a non-root user with
  `SPRING_PROFILES_ACTIVE=prod`.
- The **db** service uses a named volume, a `mysqladmin ping` healthcheck and utf8mb4 settings. The
  backend waits for it to be healthy; the frontend waits for the backend healthcheck.
- Credentials and ports are overridable through the environment (see
  [`DEVELOPMENT.md`](DEVELOPMENT.md) §6.3).

> This stack is a local/self-hosted deployment reference, not a production hardening guarantee: TLS,
> secret management, managed backups and monitoring are still open items tracked in
> [`COMPLETION_CHECKLIST.md`](COMPLETION_CHECKLIST.md).
