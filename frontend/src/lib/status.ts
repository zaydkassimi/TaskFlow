import type {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/lib/api/types";

export const PROJECT_STATUS_TONE: Record<
  ProjectStatus,
  "neutral" | "primary" | "success" | "warning"
> = {
  PLANNING: "neutral",
  ACTIVE: "primary",
  COMPLETED: "success",
  ARCHIVED: "warning",
};

export const TASK_STATUS_TONE: Record<
  TaskStatus,
  "neutral" | "primary" | "success" | "warning"
> = {
  TODO: "neutral",
  IN_PROGRESS: "primary",
  IN_REVIEW: "warning",
  DONE: "success",
};

export const TASK_PRIORITY_TONE: Record<
  TaskPriority,
  "neutral" | "primary" | "warning" | "danger"
> = {
  LOW: "neutral",
  MEDIUM: "primary",
  HIGH: "warning",
  URGENT: "danger",
};