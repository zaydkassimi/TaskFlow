import { apiFetch, toQuery } from "./http";
import type {
  CreateTaskRequest,
  PageResponse,
  Task,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  UpdateTaskRequest,
} from "./types";

export interface TaskListParams {
  page?: number;
  size?: number;
  status?: TaskStatus | "";
  priority?: TaskPriority | "";
  assignedToId?: number | "";
  search?: string;
}

export const tasksApi = {
  listByProject: (projectId: number, params: TaskListParams = {}) =>
    apiFetch<PageResponse<TaskSummary>>(
      `/projects/${projectId}/tasks${toQuery({
        page: params.page,
        size: params.size,
        status: params.status || undefined,
        priority: params.priority || undefined,
        assignedToId: params.assignedToId || undefined,
        search: params.search || undefined,
      })}`,
    ),
  create: (projectId: number, body: CreateTaskRequest) =>
    apiFetch<Task>(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  mine: (params: TaskListParams = {}) =>
    apiFetch<PageResponse<TaskSummary>>(
      `/tasks/me${toQuery({
        page: params.page,
        size: params.size,
        status: params.status || undefined,
      })}`,
    ),
  get: (id: number) => apiFetch<Task>(`/tasks/${id}`),
  update: (id: number, body: UpdateTaskRequest) =>
    apiFetch<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  changeStatus: (id: number, status: TaskStatus) =>
    apiFetch<Task>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  assign: (id: number, userId: number | null) =>
    apiFetch<Task>(`/tasks/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ userId }),
    }),
  remove: (id: number) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
};
