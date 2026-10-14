# CareerPilot — REST API Reference

> **Scope.** §1–§7 document the **implemented** API (verifiable in `controller/`). §8 lists
> **proposed** endpoints from [`CAREERPILOT_MIGRATION_PLAN.md`](../CAREERPILOT_MIGRATION_PLAN.md) —
> these do not exist yet. Base URL in development: `http://localhost:8080`.

---

## 1. Conventions

| Aspect | Value |
| --- | --- |
| Base path | `/api` |
| Content type | `application/json` (upload is `multipart/form-data`) |
| Auth | `Authorization: Bearer <JWT>` on every endpoint except `POST /api/auth/register` and `POST /api/auth/login` |
| Error payload | Shared `ApiError` record (see §7) |
| Auth failure | `401 Unauthorized` (no body) via `HttpStatusEntryPoint` when the token is missing/invalid |
| Timestamps | ISO-8601 local date-times (e.g. `2026-10-14T03:36:25.123`) |

**Endpoint access control** (`config/SecurityConfig.java`):

- Public: `/api/auth/**`, `/error`, `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`.
- Authenticated: everything else.
- Ownership is enforced **in the service layer**, not by URL pattern.

---

## 2. Authentication — `/api/auth`

### POST `/api/auth/register` · 201 Created

Registers a user and returns a JWT. Public.

**Request** (`RegisterRequest`):

```json
{
  "username": "yasmine",
  "email": "yasmine@example.com",
  "password": "secret123"
}
```

Validation: `username` `@NotBlank` `@Size(3..50)`; `email` `@NotBlank` `@Email`; `password`
`@NotBlank` `@Size(6..100)`.

**Response** (`AuthResponse`, 201):

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 1, "username": "yasmine", "email": "yasmine@example.com" }
}
```

Errors: `400 VALIDATION_ERROR` (invalid body), `409 DUPLICATE_RESOURCE` (email/username taken).

### POST `/api/auth/login` · 200 OK

**Request** (`LoginRequest`): `{ "email": "...", "password": "..." }` (`@NotBlank`, `@Email`).

**Response**: same `AuthResponse` shape as register.

Errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`.

---

## 3. Résumés — `/api/resumes`

All endpoints require a valid JWT and are owner-scoped.

### POST `/api/resumes/upload` · 201 Created

`multipart/form-data` with a single part named **`file`**. Accepted types: `.pdf`, `.docx`. Max size
10 MB (enforced by `spring.servlet.multipart.max-file-size`).

```bash
curl -X POST http://localhost:8080/api/resumes/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cv.pdf"
```

**Response** (`ResumeDto`, 201):

```json
{
  "id": 10,
  "userId": 1,
  "originalFilename": "cv.pdf",
  "fileType": "application/pdf",
  "fileSize": 84213,
  "uploadedAt": "2026-10-14T03:36:25.123",
  "latestScore": null,
  "latestAnalysisId": null
}
```

Errors: `400 BAD_REQUEST` (empty file), `400 UNSUPPORTED_FILE_TYPE` (wrong extension / unreadable
document), `400 FILE_TOO_LARGE`, `404 RESOURCE_NOT_FOUND` (unknown user).

### GET `/api/resumes` · 200 OK

Lists the caller's résumés, newest first. Each item includes the **latest** analysis score/id when one
exists.

**Response** (`ResumeDto[]`):

```json
[
  {
    "id": 10,
    "userId": 1,
    "originalFilename": "cv.pdf",
    "fileType": "application/pdf",
    "fileSize": 84213,
    "uploadedAt": "2026-10-14T03:36:25.123",
    "latestScore": 91,
    "latestAnalysisId": 5
  }
]
```

### GET `/api/resumes/{id}` · 200 OK

Returns metadata **and the extracted text**.

**Response** (`ResumeDetailDto`):

```json
{
  "id": 10,
  "userId": 1,
  "originalFilename": "cv.pdf",
  "fileType": "application/pdf",
  "fileSize": 84213,
  "extractedText": "Yasmine El Amrani\n...",
  "uploadedAt": "2026-10-14T03:36:25.123",
  "updatedAt": "2026-10-14T03:36:25.123"
}
```

Errors: `404 RESOURCE_NOT_FOUND` if the résumé does not exist **or belongs to another user**.

### DELETE `/api/resumes/{id}` · 204 No Content

Deletes the résumé; its analyses, sections and recommendations cascade. `404` if not owned/not found.

---

## 4. Analyses — `/api`

### POST `/api/resumes/{id}/analyze` · 201 Created

Runs the deterministic 7-dimension analysis on the résumé's stored text and persists the result.

**Request body:** none (empty JSON `{}` is accepted by the frontend client).

**Response** (`ResumeAnalysisDto`, 201):

```json
{
  "id": 5,
  "resumeId": 10,
  "originalFilename": "cv.pdf",
  "overallScore": 91,
  "atsScore": 100,
  "contentScore": 60,
  "structureScore": 100,
  "skillsScore": 95,
  "experienceScore": 100,
  "educationScore": 100,
  "projectsScore": 100,
  "analyzedAt": "2026-10-14T03:36:25.123",
  "sections": [
    { "id": 1, "sectionType": "ATS_COMPATIBILITY", "score": 100, "feedback": "Excellent ATS compatibility! ..." }
  ],
  "recommendations": [
    { "id": 1, "category": "Achievements", "priority": "Important", "message": "Add measurable achievements: ..." }
  ]
}
```

`sectionType` values: `ATS_COMPATIBILITY`, `CONTENT_QUALITY`, `SKILLS`, `EXPERIENCE`, `EDUCATION`,
`PROJECTS`, `STRUCTURE`. `priority` values: `Critical`, `Important`, `Suggested`.

Errors: `404 RESOURCE_NOT_FOUND` (résumé not owned/not found).

### GET `/api/resumes/{id}/analyses` · 200 OK

All analyses for one résumé, newest first (`ResumeAnalysisDto[]`). `404` if the résumé is not owned.

### GET `/api/analyses` · 200 OK

The caller's full analysis history across all résumés, newest first (`ResumeAnalysisDto[]`).

### GET `/api/analyses/{id}` · 200 OK

A single analysis (owner-scoped). `404` if not owned/not found.

### DELETE `/api/analyses/{id}` · 204 No Content

Deletes one analysis (its sections/recommendations cascade). `404` if not owned/not found.

---

## 5. Dashboard — `/api/dashboard`

### GET `/api/dashboard/stats` · 200 OK

```json
{
  "totalResumes": 3,
  "totalAnalyses": 7,
  "averageScore": 78.4,
  "bestScore": 91
}
```

`averageScore` is rounded to one decimal; `0.0`/`0` when there is no data.

---

## 6. User profile — `/api/users`

### GET `/api/users/me` · 200 OK

```json
{ "id": 1, "username": "yasmine", "email": "yasmine@example.com", "createdAt": "2026-10-01T10:00:00" }
```

### PUT `/api/users/me` · 200 OK

**Request** (`UpdateProfileRequest`): `{ "username": "new-name" }`
(`@NotBlank`, `@Size(3..50)`).

**Response**: the updated `UserProfileDto`.

Errors: `400 VALIDATION_ERROR`, `409 DUPLICATE_RESOURCE` (username taken), `404 RESOURCE_NOT_FOUND`.

---

## 7. Error responses

Every failure returns the shared `ApiError` shape (`common/ApiError.java`):

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

| HTTP status | `code` | Trigger |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Empty upload, invalid PDF/DOCX content |
| 400 | `UNSUPPORTED_FILE_TYPE` | Extension other than `.pdf`/`.docx`, unreadable file |
| 400 | `FILE_TOO_LARGE` | Upload exceeds 10 MB |
| 400 | `VALIDATION_ERROR` | Any bean-validation failure (returns the first field message) |
| 401 | `UNAUTHORIZED` | `UnauthorizedException` |
| 401 | `INVALID_CREDENTIALS` | Bad login credentials |
| 401 | *(empty body)* | Missing/invalid JWT before the controller (`HttpStatusEntryPoint`) |
| 404 | `RESOURCE_NOT_FOUND` | Missing or not-owned resource |
| 409 | `DUPLICATE_RESOURCE` | Email/username already in use |
| 500 | `INTERNAL_ERROR` | Any unhandled exception |

---

## 8. Proposed endpoints (migration roadmap — **not implemented**)

Labelled as proposed; derived from the plan (§6). They are listed to make the API growth explicit and
must not be treated as available.

| Method & path | Purpose | Phase |
| --- | --- | --- |
| `PUT /api/resumes/{id}/current` | Mark a CV version as current | 3 |
| `PATCH /api/resumes/{id}` | Rename a CV version | 3 |
| `POST /api/resumes/{id}/reanalyze` | Re-scan against a new target role / job ad | 3 |
| `GET /api/recommendations` · `PATCH /api/recommendations/{id}` | List / update status of persistent findings | 4 |
| `GET /api/profile` · `PUT /api/profile` | Candidate profile | 5 |
| `GET /api/companies` · `GET /api/jobs` · `GET /api/jobs/{id}` | Catalog search | 6 |
| `GET /api/jobs/{id}/match` | Deterministic match score | 6 |
| `GET/POST/PATCH/DELETE /api/applications…` | Application tracking + timeline | 7 |
| `GET/PUT /api/cvs/{id}/editor` · `POST /api/cvs/{id}/generate` · `GET /api/cvs/{id}/pdf` | CV editor, ATS text, PDF export | 8 |
| `POST/GET/DELETE /api/job-descriptions…` | Job-description generator | 9 |
| `GET/POST /api/interview…` | Interview planner + question bank | 10 |
| `POST/GET/PATCH/DELETE /api/roadmaps…` | Learning roadmap | 12 |
| `POST /api/copilot/chat`, `POST/GET/DELETE /api/copilot/documents…` | AI Career Copilot | 13 |

---

## 9. Note on OpenAPI / Swagger

`SecurityConfig` permits `/swagger-ui/**` and `/v3/api-docs/**`, but **no OpenAPI dependency is
present**, so no Swagger UI is currently served. Adding `springdoc-openapi-starter-webmvc-ui` is an
optional item in the migration plan (§5.2, P2). This document is the authoritative API reference
until then.
