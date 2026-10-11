import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_8px_20px_-10px_rgba(94,106,210,0.9)]",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
  outline:
    "border border-border bg-surface/50 text-foreground hover:border-border-strong hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-xs rounded-md",
  md: "h-9 gap-2 px-3.5 text-sm rounded-md",
  lg: "h-10 gap-2 px-5 text-sm rounded-md",
  icon: "h-9 w-9 rounded-md",
};

export interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center whitespace-nowrap font-medium",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-150",
    "hover:-translate-y-px active:translate-y-0 active:scale-[0.99]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
