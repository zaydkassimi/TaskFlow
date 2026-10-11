"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { tasksApi } from "@/lib/api/tasks";
import { TASK_STATUSES } from "@/lib/api/types";
import type { TaskStatus, TaskSummary } from "@/lib/api/types";
import { formatDate, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_TONE } from "@/lib/status";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { AlertIcon, ClockIcon } from "@/components/icons";

const STATUS_DOT: Record<TaskStatus, string> = {
  TODO: "bg-muted-foreground",
  IN_PROGRESS: "bg-primary-strong",
  IN_REVIEW: "bg-warning",
  DONE: "bg-success",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Todo",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
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
      className="group flex w-full flex-col gap-2.5 rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-ring/60 hover:bg-muted/30"
    >
      <span className="text-sm font-medium leading-5 text-foreground">
        {task.title}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          status={task.priority}
          tone={TASK_PRIORITY_TONE[task.priority]}
        />
        {overdue ? (
          <Badge tone="danger">
            <AlertIcon className="h-3 w-3" />
            Overdue
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <Link
          href={`/projects/${task.projectId}`}
          className="truncate text-primary-strong hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {task.projectName}
        </Link>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1",
            overdue ? "font-medium text-destructive" : undefined,
          )}
        >
          <ClockIcon className="h-3.5 w-3.5" />
          {formatDate(task.dueDate)}
        </span>
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My tasks"
        description="Tasks assigned to you across all projects."
      />

      {error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : loading && !data ? (
        <PageSpinner label="Loading your tasks…" />
      ) : data && data.content.length === 0 ? (
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
                className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        STATUS_DOT[status],
                      )}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {columnTasks.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      No tasks
                    </p>
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