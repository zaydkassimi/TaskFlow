"use client";

import { useCallback, useState } from "react";
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
  Project,
  ProjectStatus,
  TaskPriority,
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

const TASK_PAGE_SIZE = 20;
const ACTIVITY_PAGE_SIZE = 10;

const PRIORITY_BAR: Record<TaskPriority, string> = {
  LOW: "bg-muted-foreground/40",
  MEDIUM: "bg-primary",
  HIGH: "bg-warning",
  URGENT: "bg-destructive",
};

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-primary-strong",
  HIGH: "text-warning",
  URGENT: "text-destructive",
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
                {fullName(member)} ({member.email})
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

function MetaItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <span className="text-muted-foreground/70" aria-hidden="true">
        {icon}
      </span>
      {children}
    </span>
  );
}

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
        <PageHeader title="Project" />
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

      <div className="flex flex-col gap-4">
        <PageHeader
          title={project.name}
          description={project.description ?? undefined}
          action={
            <div className="flex items-center gap-2">
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
          }
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge
            status={project.status}
            tone={PROJECT_STATUS_TONE[project.status]}
          />
          <MetaItem icon={<UserIcon className="h-3.5 w-3.5" />}>
            Owned by{" "}
            <span className="font-medium text-foreground">
              {project.createdBy ? fullName(project.createdBy) : "—"}
            </span>
          </MetaItem>
          <MetaItem icon={<CalendarIcon className="h-3.5 w-3.5" />}>
            {formatDate(project.startDate)} → {formatDate(project.dueDate)}
          </MetaItem>
          <MetaItem icon={<UsersIcon className="h-3.5 w-3.5" />}>
            {project.memberCount} member
            {project.memberCount === 1 ? "" : "s"}
          </MetaItem>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3">
              <CardTitle>Tasks</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  className="w-40"
                  value={taskStatus}
                  onChange={(e) => {
                    setTaskStatus(e.target.value as TaskSummary["status"] | "");
                    setTaskPage(0);
                  }}
                >
                  <option value="">All statuses</option>
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </Select>
                <Button onClick={() => setCreateTaskOpen(true)}>
                  <PlusIcon className="h-4 w-4" />
                  New task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {tasksError ? (
                <ErrorState message={tasksError.message} onRetry={reloadTasks} />
              ) : tasksLoading && !tasks ? (
                <PageSpinner label="Loading tasks…" />
              ) : tasks && tasks.content.length === 0 ? (
                <EmptyState
                  title="No tasks found"
                  description="Create a task to get the project moving."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {tasks?.content.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setSelectedTaskId(task.id)}
                        className="group flex items-stretch gap-3 rounded-md border border-border bg-background/30 px-3 py-2.5 text-left transition-colors hover:border-ring/60 hover:bg-muted/40"
                      >
                        <span
                          className={cn(
                            "w-1 shrink-0 rounded-full",
                            PRIORITY_BAR[task.priority],
                          )}
                          aria-hidden="true"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-foreground">
                              {task.title}
                            </span>
                            <StatusBadge
                              status={task.status}
                              tone={TASK_STATUS_TONE[task.status]}
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Avatar user={task.assignedTo} size="sm" />
                              {task.assignedTo
                                ? fullName(task.assignedTo)
                                : "Unassigned"}
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1.5",
                                overdue ? "font-medium text-destructive" : "",
                              )}
                            >
                              <ClockIcon className="h-3.5 w-3.5" />
                              Due {formatDate(task.dueDate)}
                            </span>
                            <span
                              className={cn(
                                "font-medium",
                                PRIORITY_TEXT[task.priority],
                              )}
                            >
                              {titleCase(task.priority)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {tasks && tasks.totalPages > 1 ? (
                <Pagination
                  page={tasks.page}
                  totalPages={tasks.totalPages}
                  onPageChange={setTaskPage}
                  disabled={tasksLoading}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>
                Recent updates across this project.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
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
                  {activityItems.map((entry, index) => {
                    const last = index === activityItems.length - 1;
                    return (
                      <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                        {!last ? (
                          <span
                            className="absolute left-[13px] top-8 bottom-0 w-px bg-border"
                            aria-hidden="true"
                          />
                        ) : null}
                        <Avatar user={entry.user} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-5 text-foreground">
                            <span className="font-medium">
                              {entry.user ? fullName(entry.user) : "System"}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {entry.description}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatRelative(entry.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {activity && activity.totalPages > 1 ? (
                <div className="mt-3">
                  <Pagination
                    page={activity.page}
                    totalPages={activity.totalPages}
                    onPageChange={setActivityPage}
                    disabled={activityLoading}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Members</CardTitle>
            <span className="text-[13px] text-muted-foreground">
              {project.memberCount}
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ul className="flex flex-col gap-1">
              {project.members.map((member) => (
                <li
                  key={member.id}
                  className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <Avatar user={member} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {fullName(member)}
                      {member.id === project.createdBy?.id ? (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          (owner)
                        </span>
                      ) : null}
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
              <div className="border-t border-border pt-3">
                <AddMemberControl
                  projectId={project.id}
                  currentMemberIds={project.members.map((member) => member.id)}
                  onAdded={refreshAll}
                />
              </div>
            ) : (
              <p className="flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                <CheckCircleIcon className="h-4 w-4 text-success" />
                You are a member of this project
              </p>
            )}
          </CardContent>
        </Card>
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