import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export interface AvatarProps {
  user?: { firstName: string; lastName: string } | null;
  className?: string;
  size?: Size;
}

export function Avatar({ user, className, size = "md" }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold uppercase text-primary-strong ring-1 ring-inset ring-primary/20",
        SIZES[size],
        className,
      )}
      title={user ? `${user.firstName} ${user.lastName}` : undefined}
    >
      {initials(user)}
    </span>
  );
}