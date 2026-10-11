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

export const PROJECT_STATUS_DOT: Record<ProjectStatus, string> = {
  PLANNING: "bg-muted-foreground",
  ACTIVE: "bg-primary-strong",
  COMPLETED: "bg-success",
  ARCHIVED: "bg-warning",
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

export const TASK_STATUS_DOT: Record<TaskStatus, string> = {
  TODO: "bg-muted-foreground",
  IN_PROGRESS: "bg-primary-strong",
  IN_REVIEW: "bg-warning",
  DONE: "bg-success",
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
