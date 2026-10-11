import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#6d78e8] to-[#4b57c4] text-[15px] font-bold text-primary-foreground shadow-[0_6px_18px_-6px_rgba(94,106,210,0.9)]",
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-[9px] ring-1 ring-inset ring-white/15" />
      T
    </span>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-[15px] font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      TaskFlow
    </span>
  );
}
