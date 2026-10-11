import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const TONES = {
  default: "",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 shadow-sm", className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums tracking-tight", TONES[tone])}>
        {value.toLocaleString()}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}