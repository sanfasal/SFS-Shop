"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { setAuthToken } from "@/lib/api-client";
import { login as loginRequest } from "@/lib/auth";
import { LogoLoader } from "@/components/logo-loader";

type AuthPending = "login" | "logout" | null;

type AuthContextValue = {
  isAuthenticated: boolean;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  pending: AuthPending;
  setEmail: (email: string) => void;
};

const EMAIL_KEY = "sfs-shop:auth-email";
// Hold the full-screen loading state briefly after login and during logout
// (which is local-only; the API has no logout endpoint) to avoid a jarring flash.
const MIN_TRANSITION_MS = 600;

const PENDING_LABELS = {
  login: "Signing in...",
  logout: "Logging out...",
} as const;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function notify() {
  for (const listener of listeners) listener();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const email = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pending, setPending] = useState<AuthPending>(null);

  function setEmail(nextEmail: string) {
    try {
      window.localStorage.setItem(EMAIL_KEY, nextEmail);
    } catch {
      // ignore unavailable storage
    }
    notify();
  }

  async function login(nextEmail: string, password: string) {
    // Credentials are checked first so errors can still show in the login form.
    const { token } = await loginRequest(nextEmail, password);
    setPending("login");
    try {
      await wait(MIN_TRANSITION_MS);
      setAuthToken(token);
      setEmail(nextEmail);
      toast.success("Welcome back!");
    } finally {
      setPending(null);
    }
  }

  async function logout() {
    if (pending) return;
    setPending("logout");
    try {
      await wait(MIN_TRANSITION_MS);
      setAuthToken(null);
      try {
        window.localStorage.removeItem(EMAIL_KEY);
      } catch {
        // ignore unavailable storage
      }
      notify();
      toast.success("Logged out.");
    } finally {
      setPending(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(email),
        email,
        login,
        logout,
        pending,
        setEmail,
      }}
    >
      {children}
      {pending && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in-0"
        >
          <LogoLoader label={PENDING_LABELS[pending]} />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
