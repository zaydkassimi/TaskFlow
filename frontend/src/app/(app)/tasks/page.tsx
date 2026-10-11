"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { tasksApi } from "@/lib/api/tasks";
import { TASK_STATUSES } from "@/lib/api/types";
import type { TaskStatus, TaskSummary } from "@/lib/api/types";
import { formatDate, isOverdue, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TASK_PRIORITY_TONE, TASK_STATUS_TONE } from "@/lib/status";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { AlertIcon, CheckSquareIcon, ClockIcon } from "@/components/icons";

function TaskCard({
  task,
  onOpen,
}: {
  task: TaskSummary;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col gap-2 rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-ring hover:shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TASK_PRIORITY_TONE[task.priority]}>
          {titleCase(task.priority)}
        </Badge>
        {isOverdue(task.dueDate, task.status) ? (
          <Badge tone="danger">
            <AlertIcon className="h-3 w-3" />
            Overdue
          </Badge>
        ) : null}
      </div>
      <span className="font-medium text-foreground">{task.title}</span>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span className="truncate">
          In{" "}
          <Link
            href={`/projects/${task.projectId}`}
            className="text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {task.projectName}
          </Link>
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5",
            isOverdue(task.dueDate, task.status) ? "text-destructive" : "",
          )}
        >
          <ClockIcon className="h-3.5 w-3.5" />
          Due {formatDate(task.dueDate)}
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
              <Card key={status} className="bg-muted/30">
                <CardHeader className="flex-row items-center justify-between gap-2 p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckSquareIcon className="h-4 w-4" />
                    {titleCase(status)}
                  </CardTitle>
                  <Badge tone={TASK_STATUS_TONE[status]}>
                    {columnTasks.length}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 p-4 pt-2">
                  {columnTasks.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      No tasks here
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
                </CardContent>
              </Card>
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