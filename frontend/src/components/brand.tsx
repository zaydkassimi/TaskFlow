import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/image/logo.png"
      alt=""
      width={40}
      height={40}
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0 object-contain", className)}
    />
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
