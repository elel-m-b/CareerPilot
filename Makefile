.PHONY: help install backend frontend run build test verify clean \
	docker-build docker-up docker-down docker-logs docker-ps docker-down-volumes

# ---------- help ----------

help:
	@printf '%s\n' \
		'Available targets:' \
		'' \
		'Local development:' \
		'  make install     Install frontend dependencies' \
		'  make backend     Start the Spring Boot backend on port 8080 (needs JDK 21)' \
		'  make frontend    Start the React frontend on port 5173 (proxies /api to :8080)' \
		'  make run         Start the backend and frontend together' \
		'  make build       Build both applications' \
		'  make test        Run backend and frontend tests' \
		'  make verify      Full verification sweep (backend verify + frontend install, tests, build)' \
		'  make clean       Remove generated build artifacts' \
		'' \
		'Docker Compose (frontend + backend + MySQL db):' \
		'  make docker-build    Build the backend and frontend images' \
		'  make docker-up       Build images and start the stack in the background' \
		'  make docker-down     Stop the stack (keeps the database volume)' \
		'  make docker-logs     Follow the stack logs' \
		'  make docker-ps       Show service health status' \
		'  make docker-down-volumes  Stop the stack and delete the database volume (destructive)'

# ---------- local development ----------

install:
	npm --prefix frontend install

backend:
	mvn -f backend/pom.xml clean spring-boot:run

frontend:
	npm --prefix frontend run dev

run:
	@sh -c '\
		trap "kill -- $$P1 $$P2 2>/dev/null" INT TERM EXIT; \
		mvn -f backend/pom.xml -B spring-boot:run & P1=$$!; \
		npm --prefix frontend run dev & P2=$$!; \
		printf "%s\\n" \
			"Backend:  http://localhost:8080" \
			"Frontend: http://localhost:5173 (press Ctrl+C to stop both)"; \
		wait'

build:
	mvn -f backend/pom.xml clean package
	npm --prefix frontend run build

test:
	mvn -f backend/pom.xml test
	npm --prefix frontend test

verify:
	mvn -f backend/pom.xml clean verify
	npm --prefix frontend ci
	npm --prefix frontend test
	npm --prefix frontend run build

clean:
	mvn -f backend/pom.xml clean
	rm -rf frontend/dist frontend/.vite

# ---------- Docker Compose ----------

docker-build:
	docker compose build

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f --tail=100

docker-ps:
	docker compose ps

docker-down-volumes:
	docker compose down --volumes --remove-orphans
