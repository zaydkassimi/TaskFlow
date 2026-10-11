"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { projectsApi } from "@/lib/api/projects";
import { tasksApi } from "@/lib/api/tasks";
import { activityApi } from "@/lib/api/activity";
import { usersApi } from "@/lib/api/users";
import { errorMessage } from "@/lib/api/errors";
import { PROJECT_STATUSES, TASK_STATUSES } from "@/lib/api/types";
import type {
  Activity,
  ActivityType,
  Project,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  TaskSummary,
  UpdateProjectRequest,
} from "@/lib/api/types";
import {
  formatDate,
  formatRelative,
  fullName,
  isOverdue,
  titleCase,
  toDateInputValue,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  PROJECT_STATUS_TONE,
  TASK_STATUS_TONE,
} from "@/lib/status";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageSpinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { SegmentedControl } from "@/components/ui/segmented";
import {
  ActivityIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CommentIcon,
  FolderIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

const TASK_PAGE_SIZE = 20;
const ACTIVITY_PAGE_SIZE = 10;

const PRIORITY_DOT: Record<TaskPriority, string> = {
  LOW: "bg-muted-foreground",
  MEDIUM: "bg-primary-strong",
  HIGH: "bg-warning",
  URGENT: "bg-destructive",
};

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-primary-strong",
  HIGH: "text-warning",
  URGENT: "text-destructive",
};

const ACTIVITY_ICON: Record<ActivityType, (props: { className?: string }) => React.ReactNode> = {
  PROJECT_CREATED: FolderIcon,
  PROJECT_UPDATED: PencilIcon,
  MEMBER_ADDED: UsersIcon,
  MEMBER_REMOVED: UserIcon,
  TASK_CREATED: PlusIcon,
  TASK_ASSIGNED: UserIcon,
  TASK_STATUS_CHANGED: CheckCircleIcon,
  COMMENT_ADDED: CommentIcon,
};

function EditProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [startDate, setStartDate] = useState(
    toDateInputValue(project.startDate),
  );
  const [dueDate, setDueDate] = useState(toDateInputValue(project.dueDate));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const body: UpdateProjectRequest = {
        name,
        description: description.trim() || undefined,
        status,
        startDate: startDate || null,
        dueDate: dueDate || null,
      };
      await projectsApi.update(project.id, body);
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit project"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="edit-project-form" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        id="edit-project-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Name" htmlFor="project-name" required>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Description" htmlFor="project-description">
          <Textarea
            id="project-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Status" htmlFor="project-status" required>
          <Select
            id="project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" htmlFor="project-start">
            <Input
              id="project-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Due date" htmlFor="project-due">
            <Input
              id="project-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function AddMemberControl({
  projectId,
  currentMemberIds,
  onAdded,
}: {
  projectId: number;
  currentMemberIds: number[];
  onAdded: () => void;
}) {
  const { data, error, loading, reload } = useApi(usersApi.directory);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const available =
    data?.filter((member) => !currentMemberIds.includes(member.id)) ?? [];
  const value = selected || (available[0] ? String(available[0].id) : "");

  async function handleAdd() {
    if (!value) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await projectsApi.addMember(projectId, Number(value));
      setSelected("");
      onAdded();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return null;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {message ? <Alert tone="danger">{message}</Alert> : null}
      <div className="flex items-center gap-2">
        <Select
          className="flex-1"
          value={available.length > 0 ? value : ""}
          onChange={(e) => setSelected(e.target.value)}
          disabled={available.length === 0 || busy}
        >
          {available.length === 0 ? (
            <option value="">Everyone is already a member</option>
          ) : (
            available.map((member) => (
              <option key={member.id} value={String(member.id)}>
                {fullName(member)}
              </option>
            ))
          )}
        </Select>
        <Button
          variant="outline"
          onClick={handleAdd}
          disabled={available.length === 0 || busy}
        >
          <PlusIcon className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}

function MetaCell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface/60 text-muted-foreground"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 truncate text-[13px] text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

function IssueRow({
  task,
  onOpen,
}: {
  task: TaskSummary;
  onOpen: () => void;
}) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-surface/60"
    >
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
            #{task.id}
          </span>
          <span className="truncate text-sm font-medium text-foreground group-hover:text-primary-strong">
            {task.title}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span
            className={cn("font-medium", PRIORITY_TEXT[task.priority])}
          >
            {titleCase(task.priority)}
          </span>
          <span className="flex items-center gap-1.5">
            <Avatar user={task.assignedTo} size="sm" className="h-4 w-4 text-[8px]" />
            {task.assignedTo ? fullName(task.assignedTo) : "Unassigned"}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5",
              overdue && "font-medium text-destructive",
            )}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            Due {formatDate(task.dueDate)}
          </span>
        </div>
      </div>
      <StatusBadge
        status={task.status}
        tone={TASK_STATUS_TONE[task.status]}
      />
    </button>
  );
}

function ActivityRow({ entry, last }: { entry: Activity; last: boolean }) {
  const Icon = ACTIVITY_ICON[entry.type] ?? ActivityIcon;
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last ? (
        <span
          className="absolute left-[15px] top-9 bottom-0 w-px bg-border"
          aria-hidden="true"
        />
      ) : null}
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-sm leading-5 text-foreground">
          <span className="font-medium">
            {entry.user ? fullName(entry.user) : "System"}
          </span>{" "}
          <span className="text-muted-foreground">{entry.description}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRelative(entry.createdAt)}
        </p>
      </div>
    </li>
  );
}

const STATUS_FILTERS: { value: TaskStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  ...TASK_STATUSES.map((status) => ({
    value: status as TaskStatus | "",
    label: titleCase(status),
  })),
];

export function ProjectDetailClient({ projectId }: { projectId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskSummary["status"] | "">("");
  const [taskPage, setTaskPage] = useState(0);
  const [activityPage, setActivityPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const projectFetcher = useCallback(
    () => projectsApi.get(projectId),
    [projectId],
  );
  const {
    data: project,
    loading,
    error,
    reload: reloadProject,
  } = useApi(projectFetcher);

  const tasksFetcher = useCallback(
    () =>
      tasksApi.listByProject(projectId, {
        page: taskPage,
        size: TASK_PAGE_SIZE,
        status: taskStatus,
      }),
    [projectId, taskPage, taskStatus],
  );
  const {
    data: tasks,
    loading: tasksLoading,
    error: tasksError,
    reload: reloadTasks,
  } = useApi(tasksFetcher);

  const activityFetcher = useCallback(
    () =>
      activityApi.feed(projectId, {
        page: activityPage,
        size: ACTIVITY_PAGE_SIZE,
      }),
    [projectId, activityPage],
  );
  const {
    data: activity,
    loading: activityLoading,
    error: activityError,
    reload: reloadActivity,
  } = useApi(activityFetcher);

  function refreshAll() {
    reloadProject();
    reloadTasks();
    reloadActivity();
  }

  async function handleRemoveMember(targetId: number) {
    setBusy(true);
    setActionError(null);
    try {
      await projectsApi.removeMember(projectId, targetId);
      refreshAll();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProject() {
    setBusy(true);
    setActionError(null);
    try {
      await projectsApi.remove(projectId);
      router.push("/projects");
    } catch (err) {
      setActionError(errorMessage(err));
      setDeleteOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (loading && !project) {
    return <PageSpinner label="Loading project…" />;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/projects"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          All projects
        </Link>
        <ErrorState
          title="Project unavailable"
          message={error?.message}
          onRetry={reloadProject}
        />
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";
  const isOwner = project.createdBy?.id === user?.id;
  const isMember = project.members.some((member) => member.id === user?.id);
  const canManage = isAdmin || isOwner || (user?.role === "MANAGER" && isMember);
  const canDelete = isAdmin || isOwner;
  const activityItems = activity?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}

      <div className="flex flex-col gap-5">
        <Link
          href="/projects"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          All projects
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-strong ring-1 ring-inset ring-primary/25"
              aria-hidden="true"
            >
              <FolderIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status={project.status}
                  tone={PROJECT_STATUS_TONE[project.status]}
                />
                <span className="text-xs text-muted-foreground">
                  Project #{project.id}
                </span>
              </div>
              <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight text-foreground sm:text-[28px]">
                {project.name}
              </h1>
              {project.description ? (
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canManage ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <PencilIcon className="h-4 w-4" />
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="text-destructive hover:border-destructive/40 hover:bg-destructive/10"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:flex-row sm:divide-x sm:divide-y-0">
          <MetaCell
            icon={<CheckCircleIcon className="h-4 w-4" />}
            label="Status"
          >
            <StatusBadge
              status={project.status}
              tone={PROJECT_STATUS_TONE[project.status]}
            />
          </MetaCell>
          <MetaCell icon={<UserIcon className="h-4 w-4" />} label="Owner">
            {project.createdBy ? fullName(project.createdBy) : "—"}
          </MetaCell>
          <MetaCell
            icon={<CalendarIcon className="h-4 w-4" />}
            label="Timeline"
          >
            {formatDate(project.startDate)} &rarr; {formatDate(project.dueDate)}
          </MetaCell>
          <MetaCell icon={<UsersIcon className="h-4 w-4" />} label="Members">
            {project.memberCount} member{project.memberCount === 1 ? "" : "s"}
          </MetaCell>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  Tasks
                </h2>
                {tasks ? (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {tasks.totalElements}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="overflow-x-auto">
                  <SegmentedControl
                    size="sm"
                    ariaLabel="Filter tasks by status"
                    value={taskStatus}
                    onChange={(value) => {
                      setTaskStatus(value);
                      setTaskPage(0);
                    }}
                    options={STATUS_FILTERS}
                  />
                </div>
                {canManage ? (
                  <Button
                    size="sm"
                    onClick={() => setCreateTaskOpen(true)}
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    New task
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-1 p-2">
              {tasksError ? (
                <div className="p-3">
                  <ErrorState
                    message={tasksError.message}
                    onRetry={reloadTasks}
                  />
                </div>
              ) : tasksLoading && !tasks ? (
                <PageSpinner label="Loading tasks…" />
              ) : tasks && tasks.content.length === 0 ? (
                <div className="p-3">
                  <EmptyState
                    title="No tasks found"
                    description={
                      taskStatus
                        ? "No tasks with this status yet."
                        : "Create a task to get the project moving."
                    }
                  />
                </div>
              ) : (
                tasks?.content.map((task) => (
                  <IssueRow
                    key={task.id}
                    task={task}
                    onOpen={() => setSelectedTaskId(task.id)}
                  />
                ))
              )}
            </div>

            {tasks && tasks.totalPages > 1 ? (
              <div className="px-4 py-3">
                <Pagination
                  page={tasks.page}
                  totalPages={tasks.totalPages}
                  onPageChange={setTaskPage}
                  disabled={tasksLoading}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                Activity
              </h2>
            </div>
            <div className="p-5">
              {activityError ? (
                <ErrorState
                  message={activityError.message}
                  onRetry={reloadActivity}
                />
              ) : activityLoading && !activity ? (
                <PageSpinner label="Loading activity…" />
              ) : activityItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet on this project.
                </p>
              ) : (
                <ul className="flex flex-col">
                  {activityItems.map((entry, index) => (
                    <ActivityRow
                      key={entry.id}
                      entry={entry}
                      last={index === activityItems.length - 1}
                    />
                  ))}
                </ul>
              )}
              {activity && activity.totalPages > 1 ? (
                <div className="mt-4">
                  <Pagination
                    page={activity.page}
                    totalPages={activity.totalPages}
                    onPageChange={setActivityPage}
                    disabled={activityLoading}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-20 xl:h-fit">
          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  Team
                </h2>
              </div>
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {project.memberCount}
              </span>
            </div>
            <div className="flex flex-col gap-3 p-3">
              <ul className="flex flex-col gap-0.5">
                {project.members.map((member) => (
                  <li
                    key={member.id}
                    className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-surface/60"
                  >
                    <Avatar user={member} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {fullName(member)}
                        {member.id === project.createdBy?.id ? (
                          <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                            owner
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-[11px] capitalize text-muted-foreground">
                        {member.role.toLowerCase()}
                      </p>
                    </div>
                    {canManage && member.id !== project.createdBy?.id ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label={`Remove ${fullName(member)}`}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {canManage ? (
                <div className="border-t border-border px-1 pt-3">
                  <AddMemberControl
                    projectId={project.id}
                    currentMemberIds={project.members.map(
                      (member) => member.id,
                    )}
                    onAdded={refreshAll}
                  />
                </div>
              ) : (
                <p className="flex items-center gap-2 border-t border-border px-1 pt-3 text-sm text-muted-foreground">
                  <CheckCircleIcon className="h-4 w-4 text-success" />
                  You are a member of this project
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <Badge tone="neutral">Live workspace</Badge>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Keep tasks small, assign an owner, and move them across the board
              as work progresses.
            </p>
          </div>
        </div>
      </div>

      {editOpen ? (
        <EditProjectModal
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={refreshAll}
        />
      ) : null}

      {createTaskOpen ? (
        <TaskFormModal
          task={null}
          projectId={project.id}
          members={project.members}
          canAssign={canManage}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={refreshAll}
        />
      ) : null}

      {selectedTaskId ? (
        <TaskDetailModal
          taskId={selectedTaskId}
          members={project.members}
          canAssign={canManage}
          currentUserId={user?.id}
          canManageProject={canManage}
          onClose={() => setSelectedTaskId(null)}
          onChanged={refreshAll}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this project?"
        description={`"${project.name}" and all of its tasks and comments will be permanently removed.`}
        confirmLabel="Delete project"
        destructive
        busy={busy}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
