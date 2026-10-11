"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { dashboardApi } from "@/lib/api/dashboard";
import { TASK_STATUSES } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { StatCard } from "@/components/ui/stat-card";

function hourGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatusBreakdown({
  tasksByStatus,
}: {
  tasksByStatus: Record<string, number>;
}) {
  const total = TASK_STATUSES.reduce(
    (sum, status) => sum + (tasksByStatus[status] ?? 0),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by status</CardTitle>
        <CardDescription>
          {total === 0
            ? "No tasks assigned to you yet."
            : `${total} task${total === 1 ? "" : "s"} assigned to you.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {TASK_STATUSES.map((status) => {
          const count = tasksByStatus[status] ?? 0;
          const percent = total === 0 ? 0 : Math.round((count / total) * 100);
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="w-20 text-sm text-muted-foreground">
                {titleCase(status)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    status === "DONE"
                      ? "bg-success"
                      : status === "IN_PROGRESS"
                        ? "bg-primary"
                        : "bg-muted-foreground/40",
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm font-medium tabular-nums text-foreground">
                {count}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi(dashboardApi.summary);

  if (loading) {
    return <PageSpinner label="Loading your dashboard…" />;
  }

  if (error || !data) {
    return (
      <ErrorState
        message={error?.message}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${hourGreeting()}, ${user?.firstName ?? "there"}`}
        description="Here is a snapshot of your workload across projects."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Projects"
          value={data.projectCount}
          hint="You can see"
        />
        <StatCard
          label="Active projects"
          value={data.activeProjectCount}
          hint="Currently running"
        />
        <StatCard
          label="Assigned to you"
          value={data.assignedTaskCount}
          hint="Open tasks"
        />
        <StatCard
          label="Completed"
          value={data.completedTaskCount}
          hint="All time"
          tone="success"
        />
        <StatCard
          label="Overdue"
          value={data.overdueTaskCount}
          hint="Needs attention"
          tone={data.overdueTaskCount > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatusBreakdown tasksByStatus={data.tasksByStatus} />
        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Jump straight into your work.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <Link href="/projects" className="rounded-md px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted">
              Browse projects →
            </Link>
            <Link href="/tasks" className="rounded-md px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted">
              View my tasks →
            </Link>
            <Link href="/profile" className="rounded-md px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted">
              Edit my profile →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}