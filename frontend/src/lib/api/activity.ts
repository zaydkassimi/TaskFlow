import { apiFetch, toQuery } from "./http";
import type { Activity, PageResponse } from "./types";

export const activityApi = {
  feed: (projectId: number, params: { page?: number; size?: number } = {}) =>
    apiFetch<PageResponse<Activity>>(
      `/projects/${projectId}/activities${toQuery({
        page: params.page,
        size: params.size,
      })}`,
    ),
};
