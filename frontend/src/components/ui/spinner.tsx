import { cn } from "@/lib/utils";

export function Spinner({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      className={cn("h-5 w-5 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Spinner className="h-7 w-7 text-primary" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}