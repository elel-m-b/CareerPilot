/**
 * Production API base URL. Both the Compose stack and nginx serve the built
 * assets and `/api` together, so the browser always talks to one origin.
 */
export const environment = {
  production: true,
  apiBaseUrl: "/api",
};
