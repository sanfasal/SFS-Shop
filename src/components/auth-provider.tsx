"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { setAuthToken } from "@/lib/api-client";
import { login as loginRequest } from "@/lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const EMAIL_KEY = "sfs-shop:auth-email";

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

  async function login(nextEmail: string, password: string) {
    const { token } = await loginRequest(nextEmail, password);
    setAuthToken(token);
    try {
      window.localStorage.setItem(EMAIL_KEY, nextEmail);
    } catch {
      // ignore unavailable storage
    }
    notify();
  }

  function logout() {
    setAuthToken(null);
    try {
      window.localStorage.removeItem(EMAIL_KEY);
    } catch {
      // ignore unavailable storage
    }
    notify();
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: Boolean(email), email, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
