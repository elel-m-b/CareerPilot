import { api } from "@/api/endpoints";
import { UNAUTHORIZED_EVENT, getToken, setToken } from "@/api/client";
import type { AuthResponse, UserProfile } from "@/api/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Session state for the CareerPilot API.
 *
 * The backend is stateless: it issues a JWT on login/registration and expects it
 * as a bearer token afterwards. This provider owns that token, restores the
 * session on reload, and clears it whenever the API rejects it.
 */

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string | null;
};

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: SessionUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const profile = await api.users.me();
    setUser(toSessionUser(profile));
  }, []);

  // Restore the session from the stored token on first mount.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      // Without a stored token there is no session to restore, so skip the
      // request entirely instead of provoking a 401 on every public page.
      if (!getToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await api.users.me();
        if (!cancelled) setUser(toSessionUser(profile));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client fires this event when a stored token is rejected.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await api.auth.login(email.trim(), password);
    setToken(response.token);
    setUser(fromAuthResponse(response));
    // The login payload omits the account creation date, so complete the
    // profile from the authenticated endpoint. A failure here is not fatal.
    try {
      await refreshUser();
    } catch {
      /* keep the session established by the token */
    }
  }, [refreshUser]);

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      const response = await api.auth.register(username.trim(), email.trim(), password);
      setToken(response.token);
      setUser(fromAuthResponse(response));
      try {
        await refreshUser();
      } catch {
        /* keep the session established by the token */
      }
    },
    [refreshUser],
  );

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: user !== null,
      user,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }),
    [isLoading, user, signIn, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
