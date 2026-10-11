"use client";

import { useState } from "react";
import { tasksApi } from "@/lib/api/tasks";
import { errorMessage } from "@/lib/api/errors";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/api/types";
import type {
  CreateTaskRequest,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskRequest,
  UserSummary,
} from "@/lib/api/types";
import { titleCase, toDateInputValue } from "@/lib/format";
import { fullName } from "@/lib/format";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_STATUS_DOT } from "@/lib/status";

interface TaskFormModalProps {
  task: Task | null;
  projectId: number;
  members: UserSummary[];
  canAssign: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskFormModal({
  task,
  projectId,
  members,
  canAssign,
  onClose,
  onSaved,
}: TaskFormModalProps) {
  const creating = task === null;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "MEDIUM",
  );
  const [dueDate, setDueDate] = useState<string>(
    toDateInputValue(task?.dueDate),
  );
  const [assigneeId, setAssigneeId] = useState(
    task?.assignedTo ? String(task.assignedTo.id) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (creating) {
        const body: CreateTaskRequest = {
          title,
          description: description.trim() || undefined,
          status,
          priority,
          dueDate: dueDate || null,
        };
        if (canAssign && assigneeId) {
          body.assignedToId = Number(assigneeId);
        }
        await tasksApi.create(projectId, body);
      } else if (task) {
        const body: UpdateTaskRequest = {
          title,
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || null,
        };
        await tasksApi.update(task.id, body);
      }
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
      title={creating ? "Create task" : `Edit task`}
      description={
        creating
          ? "Add a new task to this project."
          : `Update "${task?.title}".`
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" disabled={busy}>
            {busy ? "Saving…" : creating ? "Create task" : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        id="task-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Title" htmlFor="task-title" required>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Implement the login flow"
            required
          />
        </Field>
        <Field label="Description" htmlFor="task-description">
          <Textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Acceptance criteria, links, notes…"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority" htmlFor="task-priority" required>
            <Select<TaskPriority>
              id="task-priority"
              value={priority}
              onChange={(v) => setPriority(v)}
              options={TASK_PRIORITIES.map((p) => ({
                value: p,
                label: titleCase(p),
              }))}
            />
          </Field>
          <Field label="Due date" htmlFor="task-due">
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>
        {creating ? (
          <Field label="Status" htmlFor="task-status" required>
            <Select<TaskStatus>
              id="task-status"
              value={status}
              onChange={(v) => setStatus(v)}
              options={TASK_STATUSES.map((s) => ({
                value: s,
                label: titleCase(s),
                dot: TASK_STATUS_DOT[s],
              }))}
            />
          </Field>
        ) : null}
        {canAssign ? (
          <Field
            label="Assignee"
            htmlFor="task-assignee"
            hint="Assignment can also be changed from the task detail view."
          >
            <Select<string>
              id="task-assignee"
              value={assigneeId}
              onChange={(v) => setAssigneeId(v)}
              options={[
                { value: "", label: "Unassigned" },
                ...members.map((member) => ({
                  value: String(member.id),
                  label: fullName(member),
                })),
              ]}
            />
          </Field>
        ) : null}
      </form>
    </Modal>
  );
}