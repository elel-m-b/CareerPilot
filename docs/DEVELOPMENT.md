# CareerPilot — Development Guide

> All commands below were verified against this repository on **2026-10-14** with **Java 21.0.12**,
> **Maven 3.6.3**, **Node 24** and **npm 11**. Run Maven/npm commands from the **`CareerPilot/`**
> directory (the folder containing `backend/`, `frontend/` and the `Makefile`).

---

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| JDK | **21** | `backend/pom.xml` targets Java 21 |
| Maven | 3.6+ | dependency/build management |
| Node.js | 20+ (CI uses 20; Node 24 also works locally) | `frontend/package.json` |
| npm | 10+ | the frontend uses npm (lockfile `package-lock.json`) |
| Git | any | |

Optional: a running **MySQL** instance if you want to exercise the prod profile.

---

## 2. Repository layout

```
CareerPilot/
├── backend/                    Spring Boot API (Maven)
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/resumeanalyzer/   controllers, services, entities, …
│       ├── main/resources/                 application*.yml, db/migration/*
│       └── test/                           JUnit tests + fixtures
├── frontend/                   React 19 SPA (Vite + Tailwind)
│   ├── package.json
│   └── src/                    api/, components/, hooks/, lib/, pages/
├── docs/                       this documentation set
├── .github/workflows/ci.yml    CI: backend verify + frontend build
├── Makefile                    convenience targets
├── CAREERPILOT_MIGRATION_PLAN.md
└── README.md
```

---

## 3. Configure the environment

### 3.1 Backend configuration

Profiles live in `backend/src/main/resources/`:

- `application.yml` — always loaded; sets `spring.profiles.active: dev`, the multipart limit
  (10 MB), the JWT settings and the `ai.*` keys.
- `application-dev.yml` — H2 in-memory, `ddl-auto: update`, H2 console at `/h2-console`.
- `application-prod.yml` — MySQL, `ddl-auto: validate`, Flyway enabled.

### 3.2 Environment variables

All have defaults; override them in your shell or IDE run configuration. **Never commit real secrets.**

| Variable | Default | Used by | Purpose |
| --- | --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Spring | Select `dev` or `prod` |
| `DB_URL` | dev: H2 mem; prod: MySQL URL | datasource | JDBC URL |
| `DB_USERNAME` | dev: `sa`; prod: `resume_user` | datasource | DB user |
| `DB_PASSWORD` | dev: empty; prod: a placeholder default | datasource | DB password |
| `DB_DRIVER` | dev: `org.h2.Driver` | datasource | JDBC driver |
| `DB_DIALECT` | dev: `org.hibernate.dialect.H2Dialect` | Hibernate | Dialect |
| `JWT_SECRET` | a hard-coded dev default | `JwtTokenProvider` | HMAC signing key |
| `AI_API_KEY` | *(empty)* | `application.yml` | Reserved for AI (unused today) |
| `AI_PROVIDER` | `openai` | `application.yml` | Reserved |
| `AI_MODEL` | `gpt-4o-mini` | `application.yml` | Reserved |

> **Security note.** Replace `JWT_SECRET` with a strong random value outside local development. The
> default value in `application.yml` is for development only.

### 3.3 Frontend configuration

The frontend calls `/api` by default. In development Vite proxies that path to the backend:

```ts
// frontend/vite.config.ts
server: {
  proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true } }
}
```

Override the target with `VITE_API_PROXY_TARGET`, or point the built SPA at an absolute API URL with
`VITE_API_BASE_URL` (for example `https://api.example.com/api`).

---

## 4. Run the React frontend

```bash
cd CareerPilot
npm --prefix frontend install     # first time only
npm --prefix frontend run dev     # Vite → http://localhost:5173
```

The dev server reloads on change and proxies `/api` to `http://localhost:8080`. Build a production
bundle with:

```bash
npm --prefix frontend run build   # output: frontend/dist
```

---

## 5. Run the Spring Boot backend

```bash
cd CareerPilot
mvn -f backend/pom.xml clean spring-boot:run    # → http://localhost:8080
```

Or package and run the jar:

```bash
mvn -f backend/pom.xml clean package
java -jar backend/target/resume-analyzer-backend-1.0.0.jar
```

With the `dev` profile the database is an in-memory H2 instance and the H2 console is available at
`http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:mem:resume_db`, user `sa`, empty password).

---

## 6. Database setup

### 6.1 Development (default)

No setup required — H2 starts in memory and Hibernate creates the schema (`ddl-auto: update`). Data
is lost on restart. No MySQL or Docker is needed.

### 6.2 Production-like (MySQL)

```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_URL="jdbc:mysql://localhost:3306/resume_analyzer_db?useSSL=false&serverTimezone=UTC"
export DB_USERNAME=resume_user
export DB_PASSWORD=<your-password>
mvn -f backend/pom.xml spring-boot:run
```

Flyway runs `V1`/`V2` against MySQL on startup, then `ddl-auto: validate` asserts the entities match
the migrated schema. There is **no committed `docker-compose.yml`** — provision MySQL yourself.

---

## 7. Build and test commands

Verified results are noted in parentheses.

| Task | Command | Result |
| --- | --- | --- |
| Backend build + tests | `mvn -f backend/pom.xml clean verify` | ✅ BUILD SUCCESS, 26 tests, 0 failures |
| Backend tests only | `mvn -f backend/pom.xml test` | ✅ |
| Frontend install | `npm --prefix frontend ci` (or `install`) | ✅ |
| Frontend build | `npm --prefix frontend run build` | ✅ `tsc -b` + `vite build` |
| Frontend unit tests | `npm --prefix frontend test` | runs Vitest; 11 tests today |
| Everything | `make verify` | chains backend verify + frontend ci + build |

`make` targets (run from `CareerPilot/`):

```
make install   # frontend npm install
make backend   # run backend on :8080
make frontend  # run frontend on :5173
make run       # both together
make build     # package backend + build frontend
make test      # backend test + frontend test
make verify    # backend clean verify + frontend ci + build
make clean     # remove target/, frontend/dist
```

> **Vitest.** `npm run test` runs once and exits; `npm run test:watch` keeps a watcher open. The
> suites are pure functions, so no browser or running backend is required.

---

## 8. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `401` on every request except login/register | Missing/expired JWT. The frontend interceptor logs you out on `401`; log in again. Check `JWT_SECRET` did not change between restarts. |
| Frontend requests fail with a CORS error | CORS is currently `*` + credentials, so this is rare — usually the backend is not running, or `VITE_API_PROXY_TARGET` / `VITE_API_BASE_URL` points to the wrong host. |
| `Table "USERS" not found` under the prod profile | Flyway did not run. Ensure `SPRING_PROFILES_ACTIVE=prod` and the `flyway` block in `application-prod.yml` is active. |
| `Schema-validation: missing column/table` on prod start | An entity changed without a matching Flyway migration; add a new `V<n>__…sql` (prod uses `ddl-auto: validate`). |
| `File size exceeds maximum allowed limit (10MB)` | The multipart limit in `application.yml`; adjust `spring.servlet.multipart.max-file-size`. |
| `Unsupported file type` | Only `.pdf` and `.docx` are accepted today. |
| `Port 8080 already in use` | Stop the other process or run with `--server.port=8081` (and update `VITE_API_PROXY_TARGET`). |
| Data disappears after backend restart | Expected in dev — H2 is in-memory. Use the prod/MySQL profile to persist. |
| `npm run test` hangs | Vitest is a one-shot run; use `npm run test:watch` for a watcher. |

---

## 9. Notes for contributors

- **Do not change product behaviour when adding a phase.** The migration plan requires the existing
  ATS checker to be preserved; characterisation tests pin its current scores.
- **Keep engines pure** (no Spring/JPA/network) once the new `analysis/engine`, `matching`,
  `cv/editor` and RAG packages exist — this is what keeps them testable.
- **Add a Flyway migration for every schema change.** Prod runs `ddl-auto: validate`.
- **Never commit secrets.** Use environment variables.
- The reference project `career-compass/` is **read-only** — do not import its code, and it is not
  part of this build.
