/**
 * API base URL for the Spring Boot service.
 *
 * The production build and the development server both talk to `/api` on the
 * same origin: nginx proxies that path to the backend container, and the
 * Angular dev server proxies it to http://localhost:8080 (proxy.conf.json).
 */
export const environment = {
  production: false,
  apiBaseUrl: "/api",
};
