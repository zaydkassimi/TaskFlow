import { Avatar } from "@/components/ui/avatar";
import {
  CheckCircleIcon,
  ClockIcon,
  CommentIcon,
  FolderIcon,
} from "@/components/icons";

const TASKS = [
  { label: "Design onboarding flow", pct: 100, tone: "bg-success" },
  { label: "Wire up task board", pct: 62, tone: "bg-primary" },
  { label: "Polish empty states", pct: 28, tone: "bg-warning" },
];

const PEOPLE = [
  { firstName: "Ada", lastName: "Lovelace" },
  { firstName: "Grace", lastName: "Hopper" },
  { firstName: "Alan", lastName: "Turing" },
];

export function AuthShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      <div
        className="pointer-events-none absolute -inset-12 -z-10 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card/90 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </span>
          <span className="ml-1 text-xs font-medium text-muted-foreground">
            TaskFlow · Project overview
          </span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary-strong">
            Live
          </span>
        </div>

        <div className="grid grid-cols-[46px_1fr]">
          <div className="flex flex-col items-center gap-3 border-r border-border py-4">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={
                  "h-6 w-6 rounded-md " +
                  (i === 1 ? "bg-primary/20 ring-1 ring-inset ring-primary/40" : "bg-muted")
                }
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 p-4">
            <div className="rounded-lg border border-border bg-surface/60 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary-strong">
                    <FolderIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[13px] font-semibold text-foreground">
                    Website redesign
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">72%</span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[72%] rounded-full bg-primary" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {TASKS.map((task) => (
                <div
                  key={task.label}
                  className="flex items-center gap-2.5 rounded-md border border-border bg-surface/40 px-2.5 py-2"
                >
                  <span
                    className={
                      "h-3.5 w-3.5 shrink-0 rounded-full " +
                      (task.pct === 100
                        ? "bg-success/20 ring-1 ring-inset ring-success/50"
                        : "border border-border-strong")
                    }
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                    {task.label}
                  </span>
                  <span className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                    <span
                      className={"block h-full rounded-full " + task.tone}
                      style={{ width: `${task.pct}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="flex -space-x-2">
                {PEOPLE.map((person) => (
                  <Avatar
                    key={person.firstName}
                    user={person}
                    size="sm"
                    className="ring-2 ring-card"
                  />
                ))}
              </span>
              <span className="text-[11px] text-muted-foreground">
                +4 collaborators
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-8 -right-6 w-56 rounded-xl border border-border bg-popover/95 p-3 shadow-lg backdrop-blur animate-panel-in">
        <div className="flex items-center gap-2">
          <Avatar user={PEOPLE[0]} size="sm" />
          <p className="min-w-0 flex-1 text-[11px] leading-4 text-muted-foreground">
            <span className="font-medium text-foreground">Ada</span> moved a task
            to <span className="text-success">Done</span>
          </p>
          <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-success" />
        </div>
        <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <CommentIcon className="h-3 w-3" />
          </span>
          <p className="text-[11px] text-muted-foreground">
            3 new comments today
          </p>
        </div>
        <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ClockIcon className="h-3 w-3" />
          </span>
          <p className="text-[11px] text-muted-foreground">
            2 tasks due this week
          </p>
        </div>
      </div>
    </div>
  );
}
