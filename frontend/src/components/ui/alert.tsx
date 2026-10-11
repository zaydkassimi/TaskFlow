import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  info: "border-primary/25 bg-primary/10",
  success: "border-success/25 bg-success/10",
  warning: "border-warning/25 bg-warning/10",
  danger: "border-destructive/25 bg-destructive/10",
};

export interface AlertProps extends React.ComponentProps<"div"> {
  tone?: Tone;
  title?: string;
}

export function Alert({
  className,
  tone = "info",
  title,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-3.5 py-2.5 text-sm text-foreground",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {title ? (
        <p className="mb-0.5 font-medium text-foreground">{title}</p>
      ) : null}
      {children}
    </div>
  );
}