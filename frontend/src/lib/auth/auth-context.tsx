"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { setAccessToken, setAuthFailureHandler } from "@/lib/api/http";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/lib/api/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (body: LoginRequest) => Promise<User>;
  register: (body: RegisterRequest) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const router = useRouter();

  const applyAuthResponse = useCallback((data: AuthResponse) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus("authenticated");
  }, []);

  const invalidate = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAuthFailureHandler(invalidate);
    authApi
      .refresh()
      .then((data) => {
        if (cancelled) {
          return;
        }
        applyAuthResponse(data);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        invalidate();
      });
    return () => {
      cancelled = true;
      setAuthFailureHandler(null);
    };
  }, [applyAuthResponse, invalidate]);

  const login = useCallback(
    async (body: LoginRequest) => {
      const data = await authApi.login(body);
      applyAuthResponse(data);
      return data.user;
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      const data = await authApi.register(body);
      applyAuthResponse(data);
      return data.user;
    },
    [applyAuthResponse],
  );

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.refresh();
      applyAuthResponse(data);
      return true;
    } catch {
      invalidate();
      return false;
    }
  }, [applyAuthResponse, invalidate]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      invalidate();
      router.push("/login");
    }
  }, [invalidate, router]);

  const value = useMemo(
    () => ({ user, status, login, register, logout, refresh }),
    [user, status, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}