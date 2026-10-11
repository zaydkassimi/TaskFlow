"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { tasksApi } from "@/lib/api/tasks";
import { TASK_STATUSES } from "@/lib/api/types";
import type { TaskPriority, TaskStatus, TaskSummary } from "@/lib/api/types";
import { formatDate, isOverdue, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TASK_STATUS_DOT } from "@/lib/status";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import {
  AlertIcon,
  ClockIcon,
  FolderIcon,
  InboxIcon,
} from "@/components/icons";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-primary-strong",
  HIGH: "text-warning",
  URGENT: "text-destructive",
};

function TaskCard({
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
      className="group flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-3.5 text-left transition-all duration-150 hover:-translate-y-px hover:border-border-strong hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/projects/${task.projectId}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-surface/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <FolderIcon className="h-3 w-3 shrink-0" />
          <span className="truncate">{task.projectName}</span>
        </Link>
        <span
          className={cn(
            "shrink-0 text-[11px] font-semibold uppercase tracking-wide",
            PRIORITY_TEXT[task.priority],
          )}
        >
          {titleCase(task.priority)}
        </span>
      </div>

      <span className="text-sm font-medium leading-5 text-foreground group-hover:text-primary-strong">
        {task.title}
      </span>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground",
            overdue && "font-medium text-destructive",
          )}
        >
          {overdue ? (
            <AlertIcon className="h-3.5 w-3.5" />
          ) : (
            <ClockIcon className="h-3.5 w-3.5" />
          )}
          {overdue ? "Overdue" : formatDate(task.dueDate)}
        </span>
        <Avatar
          user={task.assignedTo}
          size="sm"
          className="h-6 w-6 text-[9px]"
        />
      </div>
    </button>
  );
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const fetcher = useCallback(() => tasksApi.mine({ size: 200 }), []);
  const { data, loading, error, reload } = useApi(fetcher);

  const byStatus = useMemo(() => {
    const groups: Record<TaskStatus, TaskSummary[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };
    for (const task of data?.content ?? []) {
      groups[task.status].push(task);
    }
    return groups;
  }, [data]);

  const total = data?.content.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="My tasks"
        description="Everything assigned to you across all projects."
        action={
          data && total > 0 ? (
            <Badge tone="neutral">{total} assigned</Badge>
          ) : null
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : loading && !data ? (
        <PageSpinner label="Loading your tasks…" />
      ) : data && total === 0 ? (
        <EmptyState
          title="Nothing assigned yet"
          description="When someone assigns a task to you, it will show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => {
            const columnTasks = byStatus[status];
            return (
              <div
                key={status}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface/30 p-3"
              >
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("h-2 w-2 rounded-full", TASK_STATUS_DOT[status])}
                      aria-hidden="true"
                    />
                    <span className="text-[13px] font-semibold tracking-tight text-foreground">
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-8 text-center">
                      <InboxIcon className="h-4 w-4 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground">
                        No tasks
                      </span>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onOpen={() => setSelectedTaskId(task.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTaskId ? (
        <TaskDetailModal
          taskId={selectedTaskId}
          members={[]}
          canAssign={false}
          currentUserId={user?.id}
          canManageProject={false}
          onClose={() => setSelectedTaskId(null)}
          onChanged={reload}
        />
      ) : null}
    </div>
  );
}
