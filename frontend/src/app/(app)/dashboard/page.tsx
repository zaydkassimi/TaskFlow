"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { useApi } from "@/lib/hooks/use-api";
import { dashboardApi } from "@/lib/api/dashboard";
import { TASK_STATUSES } from "@/lib/api/types";
import type { DashboardSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageSpinner } from "@/components/ui/spinner";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  ClockIcon,
  FolderIcon,
  SparkleIcon,
  UserIcon,
} from "@/components/icons";

const STATUS_META: Record<
  string,
  { label: string; hex: string; dot: string; bar: string }
> = {
  TODO: {
    label: "Todo",
    hex: "#99a0ab",
    dot: "bg-muted-foreground",
    bar: "bg-muted-foreground/60",
  },
  IN_PROGRESS: {
    label: "In progress",
    hex: "#5e6ad2",
    dot: "bg-primary-strong",
    bar: "bg-primary",
  },
  IN_REVIEW: {
    label: "In review",
    hex: "#e0a948",
    dot: "bg-warning",
    bar: "bg-warning",
  },
  DONE: {
    label: "Done",
    hex: "#3fb950",
    dot: "bg-success",
    bar: "bg-success",
  },
};

function hourGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function MetricTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const iconTone = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  }[tone];
  const valueTone = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/60 px-4 py-3.5 transition-colors hover:border-border-strong">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          iconTone,
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "text-[22px] font-semibold leading-none tabular-nums tracking-tight",
            valueTone,
          )}
        >
          {value.toLocaleString()}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function DistributionPanel({ data }: { data: DashboardSummary }) {
  const total = TASK_STATUSES.reduce(
    (sum, status) => sum + (data.tasksByStatus[status] ?? 0),
    0,
  );

  let acc = 0;
  const stops: string[] = [];
  for (const status of TASK_STATUSES) {
    const count = data.tasksByStatus[status] ?? 0;
    const pct = total === 0 ? 0 : (count / total) * 100;
    const meta = STATUS_META[status];
    stops.push(`${meta.hex} ${acc}% ${acc + pct}%`);
    acc += pct;
  }
  const gradient =
    total === 0
      ? "conic-gradient(#1b2029 0% 100%)"
      : `conic-gradient(${stops.join(", ")})`;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Task distribution
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            How your assigned work is spread across statuses.
          </p>
        </div>
        <span className="flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-surface/60 px-2.5 text-sm font-semibold tabular-nums text-foreground">
          {total}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="relative mx-auto h-[140px] w-[140px] shrink-0">
          <div
            className="h-full w-full rounded-full"
            style={{ background: gradient }}
            role="img"
            aria-label="Task distribution by status"
          />
          <div className="absolute inset-[19%] flex flex-col items-center justify-center rounded-full bg-card">
            <span className="text-[26px] font-semibold leading-none tabular-nums text-foreground">
              {total}
            </span>
            <span className="mt-1 text-[11px] text-muted-foreground">
              total tasks
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {TASK_STATUSES.map((status) => {
            const count = data.tasksByStatus[status] ?? 0;
            const pct = total === 0 ? 0 : Math.round((count / total) * 100);
            const meta = STATUS_META[status];
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="flex w-24 items-center gap-2 text-[13px] text-muted-foreground">
                  <span
                    className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)}
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
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-7 text-right text-sm font-medium tabular-nums text-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="flex items-center gap-2 text-muted-foreground">
            <FolderIcon className="h-4 w-4" />
            Projects
          </span>
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              {data.activeProjectCount}
            </span>{" "}
            active of {data.projectCount}
          </span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#5e6ad2] to-[#8b94f6] transition-[width] duration-500"
            style={{
              width: `${
                data.projectCount === 0
                  ? 0
                  : Math.round(
                      (data.activeProjectCount / data.projectCount) * 100,
                    )
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function WorkloadPanel({ data }: { data: DashboardSummary }) {
  const rows = [
    {
      label: "Assigned to you",
      value: data.assignedTaskCount,
      tone: "bg-primary",
      icon: <CheckSquareIcon className="h-4 w-4" />,
    },
    {
      label: "Completed",
      value: data.completedTaskCount,
      tone: "bg-success",
      icon: <CheckCircleIcon className="h-4 w-4" />,
    },
    {
      label: "Overdue",
      value: data.overdueTaskCount,
      tone: "bg-destructive",
      icon: <AlertIcon className="h-4 w-4" />,
    },
  ];
  const max = Math.max(1, ...rows.map((row) => row.value));

  const links = [
    { href: "/projects", label: "Browse projects", icon: FolderIcon },
    { href: "/tasks", label: "View my tasks", icon: CheckSquareIcon },
    { href: "/profile", label: "Profile & settings", icon: UserIcon },
  ];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Your workload
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          A quick read on where you stand.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-muted-foreground">
                {row.icon}
                {row.label}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {row.value}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", row.tone)}
                style={{ width: `${Math.round((row.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface/60 text-muted-foreground transition-colors group-hover:text-primary-strong">
              <link.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
              {link.label}
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
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
      <section className="relative overflow-hidden rounded-xl border border-border bg-card px-6 py-7 sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute inset-0 bg-grid mask-fade-radial opacity-50"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-6 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 text-[11px] font-medium text-primary-strong">
                <SparkleIcon className="h-3 w-3" />
                Workspace overview
              </span>
              {data.overdueTaskCount > 0 ? (
                <Badge tone="danger">
                  <AlertIcon className="h-3 w-3" />
                  {data.overdueTaskCount} overdue
                </Badge>
              ) : (
                <Badge tone="success">
                  <CheckCircleIcon className="h-3 w-3" />
                  All caught up
                </Badge>
              )}
            </div>
            <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]">
              {hourGreeting()}, {user?.firstName ?? "there"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here is a snapshot of your workload across every project.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href="/projects">
                <FolderIcon className="h-4 w-4" />
                New project
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tasks">
                <CheckSquareIcon className="h-4 w-4" />
                View tasks
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricTile
          icon={<FolderIcon className="h-4 w-4" />}
          label="Projects you can see"
          value={data.projectCount}
        />
        <MetricTile
          icon={<ClockIcon className="h-4 w-4" />}
          label="Active projects"
          value={data.activeProjectCount}
        />
        <MetricTile
          icon={<CheckSquareIcon className="h-4 w-4" />}
          label="Assigned to you"
          value={data.assignedTaskCount}
        />
        <MetricTile
          icon={<CheckCircleIcon className="h-4 w-4" />}
          label="Completed"
          value={data.completedTaskCount}
          tone="success"
        />
        <MetricTile
          icon={<AlertIcon className="h-4 w-4" />}
          label="Overdue"
          value={data.overdueTaskCount}
          tone={data.overdueTaskCount > 0 ? "danger" : "default"}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DistributionPanel data={data} />
        </div>
        <div>
          <WorkloadPanel data={data} />
        </div>
      </section>
    </div>
  );
}
