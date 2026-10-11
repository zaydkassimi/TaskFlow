import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  info: "border-primary/20 bg-primary/5 text-foreground",
  success: "border-success/20 bg-success/5 text-foreground",
  warning: "border-warning/20 bg-warning/5 text-foreground",
  danger: "border-destructive/20 bg-destructive/5 text-foreground",
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
        "rounded-md border border-border px-4 py-3 text-sm",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {title ? (
        <p className="mb-1 font-medium text-foreground">{title}</p>
      ) : null}
      {children}
    </div>
  );
}