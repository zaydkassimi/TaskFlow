"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { dashboardApi } from "@/lib/api/dashboard";
import { TASK_STATUSES } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  ClockIcon,
  FolderIcon,
  UserIcon,
} from "@/components/icons";

const STATUS_META: Record<
  string,
  { label: string; bar: string; dot: string }
> = {
  TODO: { label: "Todo", bar: "bg-muted-foreground/50", dot: "bg-muted-foreground" },
  IN_PROGRESS: { label: "In progress", bar: "bg-primary", dot: "bg-primary-strong" },
  IN_REVIEW: { label: "In review", bar: "bg-warning", dot: "bg-warning" },
  DONE: { label: "Done", bar: "bg-success", dot: "bg-success" },
};

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
    <Card className="h-full">
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
          const meta = STATUS_META[status];
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="flex w-24 items-center gap-2 text-[13px] text-muted-foreground">
                <span
                  className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)}
                  aria-hidden="true"
                />
                {meta.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    meta.bar,
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

function QuickLinks() {
  const links = [
    {
      href: "/projects",
      icon: FolderIcon,
      label: "Browse projects",
      description: "See what your team is working on",
    },
    {
      href: "/tasks",
      icon: CheckSquareIcon,
      label: "View my tasks",
      description: "Everything assigned to you",
    },
    {
      href: "/profile",
      icon: UserIcon,
      label: "Edit my profile",
      description: "Update your details and password",
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick links</CardTitle>
        <CardDescription>Jump straight into your work.</CardDescription>
      </CardHeader>
      <CardContent className="p-2 pt-1">
        <div className="flex flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background/40 text-muted-foreground">
                <link.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {link.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {link.description}
                </span>
              </span>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
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
    return <ErrorState message={error?.message} onRetry={reload} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${hourGreeting()}, ${user?.firstName ?? "there"}`}
        description="Here is a snapshot of your workload across projects."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Projects"
          value={data.projectCount}
          hint="You can see"
          icon={<FolderIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Active projects"
          value={data.activeProjectCount}
          hint="Currently running"
          icon={<ClockIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Assigned to you"
          value={data.assignedTaskCount}
          hint="Open tasks"
          icon={<CheckSquareIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Completed"
          value={data.completedTaskCount}
          hint="All time"
          tone="success"
          icon={<CheckCircleIcon className="h-4 w-4" />}
        />
        <StatCard
          label="Overdue"
          value={data.overdueTaskCount}
          hint="Needs attention"
          tone={data.overdueTaskCount > 0 ? "danger" : "default"}
          icon={<AlertIcon className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <StatusBreakdown tasksByStatus={data.tasksByStatus} />
        </div>
        <div className="lg:col-span-2">
          <QuickLinks />
        </div>
      </div>
    </div>
  );
}