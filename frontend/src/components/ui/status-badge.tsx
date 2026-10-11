import { titleCase } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

interface StatusBadgeProps {
  status: string;
  tone: Tone;
  label?: string;
  className?: string;
}

export function StatusBadge({
  status,
  tone,
  label,
  className,
}: StatusBadgeProps) {
  return (
    <Badge tone={tone} className={className}>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
        aria-hidden="true"
      />
      {titleCase(label ?? status)}
    </Badge>
  );
}