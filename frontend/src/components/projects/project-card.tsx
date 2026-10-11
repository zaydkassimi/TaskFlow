import Link from "next/link";
import type { ProjectSummary } from "@/lib/api/types";
import { formatDate, isOverdue } from "@/lib/format";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { CalendarIcon, ClockIcon, FolderIcon } from "@/components/icons";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const overdue = isOverdue(project.dueDate, project.status);

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-ring/60">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background/40 text-muted-foreground transition-colors group-hover:text-primary-strong">
              <FolderIcon className="h-4 w-4" />
            </span>
            <StatusBadge
              status={project.status}
              tone={PROJECT_STATUS_TONE[project.status]}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <h3 className="line-clamp-1 text-[15px] font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary-strong">
              {project.name}
            </h3>
            <div className="mt-2 flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                Created {formatDate(project.createdAt)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  overdue ? "font-medium text-destructive" : undefined,
                )}
              >
                <ClockIcon className="h-3.5 w-3.5" />
                Due {formatDate(project.dueDate)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}