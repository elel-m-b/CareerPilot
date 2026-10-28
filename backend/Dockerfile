# syntax=docker/dockerfile:1

# ---------- build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Cache the dependency layer separately from the source.
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package

# ---------- runtime ----------
FROM eclipse-temurin:21-jre-alpine

# curl backs the container healthcheck used by Docker Compose.
RUN apk add --no-cache curl \
    && addgroup -S app \
    && adduser -S app -G app

WORKDIR /app
COPY --from=build /workspace/target/resume-analyzer-backend-1.0.0.jar app.jar

USER app
EXPOSE 8080

# A protected endpoint returning 401 proves the HTTP stack and security chain
# are ready; connection refused / timeouts fail the check.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=12 \
    CMD curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/dashboard/stats | grep -q 401 || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
