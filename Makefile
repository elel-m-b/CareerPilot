.PHONY: help install backend frontend run build test verify clean

help:
	@printf '%s\n' \
		'Available targets:' \
		'  make install   Install frontend dependencies' \
		'  make backend   Start the Spring Boot backend on port 8080' \
		'  make frontend  Start the React frontend on port 5173 (proxies /api to :8080)' \
		'  make run       Start the backend and frontend together' \
		'  make build     Build both applications' \
		'  make test      Run backend and frontend tests' \
		'  make verify    Run the full verification sweep (backend verify + frontend tests and build)' \
		'  make clean     Remove generated build artifacts'

install:
	npm --prefix frontend install

backend:
	mvn -f backend/pom.xml clean spring-boot:run

frontend:
	npm --prefix frontend run dev

run:
	@trap 'kill 0' INT TERM EXIT; \
		$(MAKE) backend & \
		$(MAKE) frontend & \
		wait

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
