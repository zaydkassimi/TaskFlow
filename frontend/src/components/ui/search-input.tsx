"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "@/components/icons";

export function SearchInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <div className={cn("relative flex-1", className)}>
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input className="pl-9" {...props} />
    </div>
  );
}