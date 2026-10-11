import { apiFetch } from "./http";
import type { DashboardSummary } from "./types";

export const dashboardApi = {
  summary: () => apiFetch<DashboardSummary>("/dashboard/summary"),
};
