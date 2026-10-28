import type { ApiErrorPayload } from "@/api/types";

/**
 * Thin fetch wrapper around the CareerPilot Spring Boot API.
 *
 * - The JWT is kept in `localStorage` under `careerpilot.token`, matching the
 *   stateless auth model the backend already implements.
 * - Errors are normalised into `ApiError` so pages can show the server's
 *   `{ code, message }` contract without inspecting response objects.
 */

const TOKEN_KEY = "careerpilot.token";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "REQUEST_FAILED") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Fired whenever the API rejects the stored token, so the app can sign out. */
export const UNAUTHORIZED_EVENT = "careerpilot:unauthorized";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* Private mode or blocked storage: the session simply will not persist. */
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
};

async function parseError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload | null = null;
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  let message = payload?.message ?? "";
  if (!message && payload?.errors) {
    message = Object.values(payload.errors).join(" ");
  }
  if (!message) {
    if (response.status === 401) message = "Your session expired. Please sign in again.";
    else if (response.status === 403) message = "You do not have access to this resource.";
    else if (response.status === 404) message = "That resource could not be found.";
    else if (response.status >= 500) message = "The server could not complete the request.";
    else message = "The request could not be completed.";
  }

  return new ApiError(message, response.status, payload?.code ?? "REQUEST_FAILED");
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers({ Accept: "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(
      "Could not reach the CareerPilot API. Is the backend running on port 8080?",
      0,
      "NETWORK_ERROR",
    );
  }

  if (response.status === 401) {
    // A rejected token means the session is no longer usable. The auth provider
    // listens for this and clears local state; /auth/login itself is exempt
    // because it is a credential check, not an expired session.
    if (!path.startsWith("/auth/")) {
      setToken(null);
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    throw await parseError(response);
  }

  if (!response.ok) throw await parseError(response);

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
