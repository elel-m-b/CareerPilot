/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Spring Boot API. Defaults to the dev proxy at `/api`. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
