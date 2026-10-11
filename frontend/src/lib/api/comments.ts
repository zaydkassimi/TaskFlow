import { apiFetch } from "./http";
import type { Comment } from "./types";

export const commentsApi = {
  list: (taskId: number) => apiFetch<Comment[]>(`/tasks/${taskId}/comments`),
  create: (taskId: number, content: string) =>
    apiFetch<Comment>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  update: (id: number, content: string) =>
    apiFetch<Comment>(`/comments/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
  remove: (id: number) => apiFetch<void>(`/comments/${id}`, { method: "DELETE" }),
};
