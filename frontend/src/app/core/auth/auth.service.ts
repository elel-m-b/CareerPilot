import { Injectable, computed, inject, signal } from "@angular/core";
import { UNAUTHORIZED_EVENT, getToken, setToken } from "../api/api-client.service";
import type { AuthResponse, UserProfile } from "../api/api.types";
import { ApiService } from "../api/api.service";

/**
 * Session state for the CareerPilot API.
 *
 * The backend is stateless: it issues a JWT on login/registration and expects it
 * as a bearer token afterwards. This service owns that token, restores the
 * session on reload, and clears it whenever the API rejects it.
 */

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string | null;
};

function toSessionUser(profile: UserProfile): SessionUser {
  return {
    id: profile.id,
    name: profile.username,
    email: profile.email,
    createdAt: profile.createdAt ?? null,
  };
}

function fromAuthResponse(response: AuthResponse): SessionUser {
  return {
    id: response.user.id,
    name: response.user.username,
    email: response.user.email,
    createdAt: null,
  };
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly api = inject(ApiService);

  readonly user = signal<SessionUser | null>(null);
  readonly isLoading = signal(true);
  readonly isAuthenticated = computed(() => this.user() !== null);

  /** Resolves once the stored token has been checked, so guards can await it. */
  readonly ready: Promise<void>;

  private resolveReady!: () => void;

  constructor() {
    this.ready = new Promise<void>((resolve) => (this.resolveReady = resolve));

    window.addEventListener(UNAUTHORIZED_EVENT, () => {
      this.user.set(null);
      this.isLoading.set(false);
    });

    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    // Without a stored token there is no session to restore, so skip the
    // request entirely instead of provoking a 401 on every public page.
    if (!getToken()) {
      this.isLoading.set(false);
      this.resolveReady();
      return;
    }

    try {
      const profile = await this.api.users.me();
      this.user.set(toSessionUser(profile));
    } catch {
      this.user.set(null);
    } finally {
      this.isLoading.set(false);
      this.resolveReady();
    }
  }

  async refreshUser(): Promise<void> {
    const profile = await this.api.users.me();
    this.user.set(toSessionUser(profile));
  }

  async signIn(email: string, password: string): Promise<void> {
    const response = await this.api.auth.login(email.trim(), password);
    setToken(response.token);
    this.user.set(fromAuthResponse(response));
    // The login payload omits the account creation date, so complete the
    // profile from the authenticated endpoint. A failure here is not fatal.
    try {
      await this.refreshUser();
    } catch {
      /* keep the session established by the token */
    }
  }

  async signUp(username: string, email: string, password: string): Promise<void> {
    const response = await this.api.auth.register(username.trim(), email.trim(), password);
    setToken(response.token);
    this.user.set(fromAuthResponse(response));
    try {
      await this.refreshUser();
    } catch {
      /* keep the session established by the token */
    }
  }

  signOut(): void {
    setToken(null);
    this.user.set(null);
  }
}
