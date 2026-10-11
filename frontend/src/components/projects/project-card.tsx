import Link from "next/link";
import type { ProjectStatus, ProjectSummary } from "@/lib/api/types";
import { formatDate, isOverdue } from "@/lib/format";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  FolderIcon,
} from "@/components/icons";

const ACCENT: Record<ProjectStatus, { line: string; tile: string }> = {
  PLANNING: {
    line: "from-muted-foreground/60 to-transparent",
    tile: "bg-muted text-muted-foreground",
  },
  ACTIVE: {
    line: "from-primary to-transparent",
    tile: "bg-primary/15 text-primary-strong",
  },
  COMPLETED: {
    line: "from-success to-transparent",
    tile: "bg-success/15 text-success",
  },
  ARCHIVED: {
    line: "from-warning to-transparent",
    tile: "bg-warning/15 text-warning",
  },
};

function projectMeta(project: ProjectSummary) {
  const overdue =
    isOverdue(project.dueDate, project.status) &&
    project.status !== "COMPLETED" &&
    project.status !== "ARCHIVED";
  return { overdue };
}

export function ProjectCard({
  project,
  layout = "grid",
}: {
  project: ProjectSummary;
  layout?: "grid" | "list";
}) {
  const { overdue } = projectMeta(project);
  const accent = ACCENT[project.status];

  if (layout === "list") {
    return (
      <Link href={`/projects/${project.id}`} className="group block">
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-all duration-200 hover:-translate-y-px hover:border-border-strong hover:bg-surface/60">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
              accent.tile,
            )}
            aria-hidden="true"
          >
            <FolderIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary-strong">
              {project.name}
            </p>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-3 w-3" />
                {formatDate(project.createdAt)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  overdue && "font-medium text-destructive",
                )}
              >
                <ClockIcon className="h-3 w-3" />
                Due {formatDate(project.dueDate)}
              </span>
            </div>
          </div>
          <StatusBadge
            status={project.status}
            tone={PROJECT_STATUS_TONE[project.status]}
            className="hidden sm:inline-flex"
          />
          <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg">
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-gradient-to-r",
            accent.line,
          )}
          aria-hidden="true"
        />
        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                accent.tile,
              )}
              aria-hidden="true"
            >
              <FolderIcon className="h-4 w-4" />
            </span>
            <StatusBadge
              status={project.status}
              tone={PROJECT_STATUS_TONE[project.status]}
            />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary-strong">
              {project.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Project #{project.id}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Created {formatDate(project.createdAt)}
            </span>
            <span
              className={cn(
                "flex items-center gap-1.5",
                overdue && "font-medium text-destructive",
              )}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              Due {formatDate(project.dueDate)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
