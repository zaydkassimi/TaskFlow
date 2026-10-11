"use client";

import { useCallback, useState } from "react";
import { tasksApi } from "@/lib/api/tasks";
import { commentsApi } from "@/lib/api/comments";
import { useApi } from "@/lib/hooks/use-api";
import { errorMessage } from "@/lib/api/errors";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/api/types";
import type {
  Task,
  TaskPriority,
  TaskStatus,
  UserSummary,
} from "@/lib/api/types";
import {
  fullName,
  formatDate,
  isOverdue,
  titleCase,
  toDateInputValue,
  formatRelative,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { TASK_STATUS_TONE, TASK_PRIORITY_TONE } from "@/lib/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { PageSpinner } from "@/components/ui/spinner";
import { AlertIcon, CommentIcon, TrashIcon } from "@/components/icons";

interface TaskDetailModalProps {
  taskId: number;
  members: UserSummary[];
  canAssign: boolean;
  currentUserId: number | undefined;
  canManageProject: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function TaskDetailModal({
  taskId,
  members,
  canAssign,
  currentUserId,
  canManageProject,
  onClose,
  onChanged,
}: TaskDetailModalProps) {
  const taskFetcher = useCallback(() => tasksApi.get(taskId), [taskId]);
  const { data: task, loading, error, reload } = useApi(taskFetcher);

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Task details"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading ? (
        <PageSpinner label="Loading task…" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : task ? (
        <TaskDetailContent
          key={task.id}
          task={task}
          members={members}
          canAssign={canAssign}
          currentUserId={currentUserId}
          canManageProject={canManageProject}
          onClose={onClose}
          onChanged={onChanged}
        />
      ) : null}
    </Modal>
  );
}

function TaskDetailContent({
  task,
  members,
  canAssign,
  currentUserId,
  canManageProject,
  onClose,
  onChanged,
}: {
  task: Task;
  members: UserSummary[];
  canAssign: boolean;
  currentUserId: number | undefined;
  canManageProject: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const canModify =
    canManageProject || task.createdBy?.id === currentUserId;
  const canChangeStatus = canModify || task.assignedTo?.id === currentUserId;

  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [assigneeId, setAssigneeId] = useState(
    task.assignedTo ? String(task.assignedTo.id) : "",
  );
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const commentsFetcher = useCallback(() => commentsApi.list(task.id), [task.id]);
  const { data: comments, reload: reloadComments } = useApi(commentsFetcher);

  async function handleSaveStatus(next: TaskStatus) {
    setBusy(true);
    setError(null);
    try {
      await tasksApi.changeStatus(task.id, next);
      setStatus(next);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAssign(next: string) {
    setBusy(true);
    setError(null);
    try {
      await tasksApi.assign(task.id, next ? Number(next) : null);
      setAssigneeId(next);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await tasksApi.update(task.id, {
        title,
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || null,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await tasksApi.remove(task.id);
      setDeleteOpen(false);
      onChanged();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setDeleteOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await commentsApi.create(task.id, trimmed);
      setComment("");
      reloadComments();
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    setBusy(true);
    setError(null);
    try {
      await commentsApi.remove(commentId);
      reloadComments();
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{task.title}</h3>
          <Badge
            tone={TASK_STATUS_TONE[status]}
            className="uppercase"
          >
            {titleCase(status)}
          </Badge>
          <Badge tone={TASK_PRIORITY_TONE[task.priority]}>
            {titleCase(task.priority)} priority
          </Badge>
          {task.overdue ? (
            <Badge tone="danger">
              <AlertIcon className="h-3 w-3" />
              Overdue
            </Badge>
          ) : null}
        </div>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Project</dt>
            <dd className="text-foreground">{task.projectName}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Due date</dt>
            <dd
              className={cn(
                isOverdue(task.dueDate, status)
                  ? "font-medium text-destructive"
                  : "text-foreground",
              )}
            >
              {formatDate(task.dueDate)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Created by</dt>
            <dd className="text-foreground">
              {task.createdBy ? fullName(task.createdBy) : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-muted-foreground">
              {formatRelative(task.createdAt)}
            </dd>
          </div>
        </dl>

        {canChangeStatus || canAssign ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {canChangeStatus ? (
              <Field label="Status">
                <Select
                  value={status}
                  disabled={busy}
                  onChange={(e) => handleSaveStatus(e.target.value as TaskStatus)}
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            {canAssign ? (
              <Field label="Assignee">
                <Select
                  value={assigneeId}
                  disabled={busy}
                  onChange={(e) => handleAssign(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={String(member.id)}>
                      {fullName(member)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>
        ) : null}
      </div>

      {editing ? (
        <form id="task-detail-form" onSubmit={handleSaveDetails} className="flex flex-col gap-4">
          <Field label="Title" htmlFor="detail-title" required>
            <Input
              id="detail-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>
          <Field label="Description" htmlFor="detail-description">
            <Textarea
              id="detail-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority" htmlFor="detail-priority" required>
              <Select
                id="detail-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {titleCase(p)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date" htmlFor="detail-due">
              <Input
                id="detail-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={busy}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" form="task-detail-form" disabled={busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      ) : task.description ? (
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {task.description}
        </p>
      ) : null}

      {canModify ? (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:bg-destructive/10"
          >
            <TrashIcon className="h-4 w-4" />
            Delete task
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CommentIcon className="h-4 w-4" />
          Comments ({comments?.length ?? 0})
        </div>
        <div className="flex flex-col gap-3">
          {comments && comments.length > 0 ? (
            comments.map((commentItem) => (
              <div
                key={commentItem.id}
                className="flex items-start gap-3 rounded-md border border-border bg-card p-3"
              >
                <Avatar user={commentItem.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {commentItem.author ? fullName(commentItem.author) : "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(commentItem.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {commentItem.content}
                  </p>
                </div>
                {currentUserId === commentItem.author?.id || canManageProject ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    onClick={() => handleDeleteComment(commentItem.id)}
                    className="text-destructive hover:bg-destructive/10"
                    aria-label="Delete comment"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No comments yet. Start the discussion.
            </p>
          )}
        </div>
        <form onSubmit={handleAddComment} className="flex flex-col gap-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment…"
            className="min-h-20"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={busy || !comment.trim()}>
              Add comment
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this task?"
        description={`"${task.title}" will be permanently removed from the project.`}
        confirmLabel="Delete task"
        destructive
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}