import { apiFetch, toQuery } from "./http";
import type {
  CreateProjectRequest,
  PageResponse,
  Project,
  ProjectStatus,
  ProjectSummary,
  UpdateProjectRequest,
  UserSummary,
} from "./types";

export interface ProjectListParams {
  page?: number;
  size?: number;
  status?: ProjectStatus | "";
  search?: string;
  mine?: boolean;
}

export const projectsApi = {
  list: (params: ProjectListParams = {}) =>
    apiFetch<PageResponse<ProjectSummary>>(
      `/projects${toQuery({
        page: params.page,
        size: params.size,
        status: params.status || undefined,
        search: params.search || undefined,
        mine: params.mine ? true : undefined,
      })}`,
    ),
  get: (id: number) => apiFetch<Project>(`/projects/${id}`),
  create: (body: CreateProjectRequest) =>
    apiFetch<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: number, body: UpdateProjectRequest) =>
    apiFetch<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id: number) => apiFetch<void>(`/projects/${id}`, { method: "DELETE" }),
  members: (id: number) =>
    apiFetch<UserSummary[]>(`/projects/${id}/members`),
  addMember: (id: number, userId: number) =>
    apiFetch<Project>(`/projects/${id}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  removeMember: (id: number, userId: number) =>
    apiFetch<void>(`/projects/${id}/members/${userId}`, { method: "DELETE" }),
};
