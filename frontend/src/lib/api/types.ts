export const ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];

export const PROJECT_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const ACTIVITY_TYPES = [
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "MEMBER_ADDED",
  "MEMBER_REMOVED",
  "TASK_CREATED",
  "TASK_ASSIGNED",
  "TASK_STATUS_CHANGED",
  "COMMENT_ADDED",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: User;
}

export interface ProjectSummary {
  id: number;
  name: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  createdBy: UserSummary | null;
  members: UserSummary[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  projectName: string;
  assignedTo: UserSummary | null;
  dueDate: string | null;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  projectName: string;
  assignedTo: UserSummary | null;
  createdBy: UserSummary | null;
  dueDate: string | null;
  overdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  author: UserSummary | null;
  taskId: number;
  createdAt: string;
}

export interface Activity {
  id: number;
  type: ActivityType;
  description: string;
  user: UserSummary | null;
  projectId: number | null;
  taskId: number | null;
  createdAt: string;
}

export interface DashboardSummary {
  projectCount: number;
  activeProjectCount: number;
  assignedTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  tasksByStatus: Record<TaskStatus, number>;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: Record<string, string> | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  enabled?: boolean;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  enabled: boolean;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
  memberIds?: number[];
}

export interface UpdateProjectRequest {
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: number | null;
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string | null;
}
