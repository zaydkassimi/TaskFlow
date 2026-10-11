"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CloseIcon } from "@/components/icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  hideClose?: boolean;
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px] animate-overlay-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lg animate-panel-in",
          SIZES[size],
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {description ? (
                <p className="text-[13px] text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {!hideClose ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1 -mt-1 shrink-0"
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : (
          !hideClose && (
            <div className="flex justify-end px-5 pt-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1"
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            </div>
          )
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-card/50 px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}