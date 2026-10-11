import { BrandMark } from "@/components/brand";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import {
  ActivityIcon,
  CheckSquareIcon,
  FolderIcon,
} from "@/components/icons";

const FEATURES = [
  { icon: FolderIcon, label: "Projects" },
  { icon: CheckSquareIcon, label: "Tasks" },
  { icon: ActivityIcon, label: "Activity" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface/40 p-10 lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 bg-grid mask-fade-radial opacity-60"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_35%_0%,rgb(94_106_210/0.20),transparent_70%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-2.5">
          <BrandMark className="h-9 w-9 rounded-[11px] text-base" />
          <span className="text-[17px] font-semibold tracking-tight text-foreground">
            TaskFlow
          </span>
        </div>

        <div className="relative z-10 mt-10 max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-strong">
            Productivity workspace
          </p>
          <h1 className="mt-4 text-[40px] font-semibold leading-[1.04] tracking-tight text-foreground xl:text-[44px]">
            Plan work.
            <br />
            <span className="text-primary-strong text-glow">Move faster.</span>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            One calm workspace for your projects, tasks and team — so everyone
            knows what to do next.
          </p>
        </div>

        <div className="relative z-10 mt-12 px-6">
          <AuthShowcase />
        </div>

        <div className="relative z-10 mt-14 flex items-center gap-6">
          {FEATURES.map((feature) => (
            <span
              key={feature.label}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
            >
              <feature.icon className="h-4 w-4 text-primary-strong/80" />
              {feature.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            TaskFlow
          </span>
        </div>
        <div className="w-full max-w-[400px] animate-rise">{children}</div>
      </div>
    </div>
  );
}
