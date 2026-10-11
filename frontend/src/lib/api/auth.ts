import { apiFetch } from "./http";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "./types";

export const authApi = {
  login: (body: LoginRequest) =>
    apiFetch<AuthResponse>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) },
      { auth: false, retryOn401: false },
    ),
  register: (body: RegisterRequest) =>
    apiFetch<AuthResponse>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(body) },
      { auth: false, retryOn401: false },
    ),
  refresh: () =>
    apiFetch<AuthResponse>(
      "/auth/refresh",
      { method: "POST" },
      { auth: false, retryOn401: false },
    ),
  logout: () =>
    apiFetch<void>(
      "/auth/logout",
      { method: "POST" },
      { auth: false, retryOn401: false },
    ),
  me: () => apiFetch<User>("/auth/me"),
};
