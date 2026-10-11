import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@/components/icons";

export function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "flex h-9 w-full cursor-pointer appearance-none rounded-md border border-input bg-transparent py-1.5 pl-3 pr-9 text-sm text-foreground",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  );
}