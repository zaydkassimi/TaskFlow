import { apiFetch, toQuery } from "./http";
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  PageResponse,
  Role,
  UpdateProfileRequest,
  UpdateUserRequest,
  User,
  UserSummary,
} from "./types";

export interface UserListParams {
  page?: number;
  size?: number;
  role?: Role | "";
  search?: string;
}

export const usersApi = {
  directory: () =>
    apiFetch<UserSummary[]>("/users/directory"),
  list: (params: UserListParams = {}) =>
    apiFetch<PageResponse<User>>(
      `/users${toQuery({
        page: params.page,
        size: params.size,
        role: params.role || undefined,
        search: params.search || undefined,
      })}`,
    ),
  me: () => apiFetch<User>("/users/me"),
  updateMe: (body: UpdateProfileRequest) =>
    apiFetch<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  changePassword: (body: ChangePasswordRequest) =>
    apiFetch<void>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  get: (id: number) => apiFetch<User>(`/users/${id}`),
  create: (body: CreateUserRequest) =>
    apiFetch<User>("/users", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: UpdateUserRequest) =>
    apiFetch<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  setStatus: (id: number, enabled: boolean) =>
    apiFetch<User>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    }),
  remove: (id: number) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
};
