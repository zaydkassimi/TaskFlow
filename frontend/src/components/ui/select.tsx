"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  /** Optional Tailwind background class for a status dot (e.g. "bg-success"). */
  dot?: string;
}

interface SelectProps<T extends string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  align?: "start" | "end";
}

const MENU_MAX_HEIGHT = 264;
const MENU_GAP = 6;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface MenuPosition {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
}

function computePosition(
  trigger: HTMLElement,
  align: "start" | "end",
): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;
  const spaceBelow = viewportH - rect.bottom - MENU_GAP;
  const spaceAbove = rect.top - MENU_GAP;
  const openUp =
    spaceBelow < Math.min(MENU_MAX_HEIGHT, 200) && spaceAbove > spaceBelow;
  const maxHeight = Math.max(
    96,
    Math.min(MENU_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow),
  );
  const width = rect.width;
  let left = align === "end" ? rect.right - width : rect.left;
  left = Math.max(8, Math.min(left, viewportW - width - 8));
  const top = openUp ? rect.top - MENU_GAP : rect.bottom + MENU_GAP;
  return { left, top, width, maxHeight, openUp };
}

export function Select<T extends string>({
  options,
  value,
  onChange,
  id,
  className,
  disabled = false,
  placeholder = "Select…",
  ariaLabel,
  align = "start",
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const listId = `${baseId}-listbox`;

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const optionId = useCallback(
    (index: number) => `${baseId}-option-${index}`,
    [baseId],
  );

  const firstEnabledIndex = useCallback(() => {
    const index = options.findIndex((option) => !option.disabled);
    return index;
  }, [options]);

  const lastEnabledIndex = useCallback(() => {
    for (let i = options.length - 1; i >= 0; i -= 1) {
      if (!options[i].disabled) {
        return i;
      }
    }
    return -1;
  }, [options]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }
    setPosition(computePosition(triggerRef.current, align));
  }, [align]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const openMenu = useCallback(() => {
    const initial = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex();
    setActiveIndex(initial);
    setOpen(true);
  }, [selectedIndex, firstEnabledIndex]);

  const commit = useCallback(
    (next: T) => {
      onChange(next);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const moveActive = useCallback(
    (step: 1 | -1) => {
      setActiveIndex((current) => {
        if (options.length === 0) {
          return -1;
        }
        let index = current;
        if (index < 0 || index >= options.length) {
          index = step === 1 ? -1 : options.length;
        }
        for (let i = 0; i < options.length; i += 1) {
          index = (index + step + options.length) % options.length;
          if (!options[index].disabled) {
            return index;
          }
        }
        return current;
      });
    },
    [options],
  );

  const selectActive = useCallback(() => {
    const option = options[activeIndex];
    if (option && !option.disabled) {
      commit(option.value);
    }
  }, [options, activeIndex, commit]);

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }
    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(firstEnabledIndex());
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(lastEnabledIndex());
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectActive();
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        break;
    }
  }

  useIsoLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) {
      return;
    }
    const node = document.getElementById(optionId(activeIndex));
    node?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, optionId]);

  const activeOption = options[activeIndex];

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={
          open && activeOption ? optionId(activeIndex) : undefined
        }
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent pl-3 pr-2.5 text-left text-sm text-foreground",
          "transition-colors duration-150",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selectedOption?.dot ? (
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                selectedOption.dot,
              )}
              aria-hidden="true"
            />
          ) : null}
          <span
            className={cn(
              "truncate",
              selectedOption ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <ul
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              className="fixed z-[60] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg animate-menu-in"
              style={{
                left: position.left,
                top: position.top,
                width: position.width,
                maxHeight: position.maxHeight,
                transform: position.openUp ? "translateY(-100%)" : undefined,
              }}
            >
              {options.length === 0 ? (
                <li className="px-2.5 py-2 text-sm text-muted-foreground">
                  No options
                </li>
              ) : (
                options.map((option, index) => {
                  const selected = option.value === value;
                  const active = index === activeIndex;
                  return (
                    <li
                      key={`${option.value}-${index}`}
                      id={optionId(index)}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={option.disabled || undefined}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => {
                        if (!option.disabled) {
                          setActiveIndex(index);
                        }
                      }}
                      onClick={() => {
                        if (!option.disabled) {
                          commit(option.value);
                        }
                      }}
                      className={cn(
                        "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active && !option.disabled ? "bg-muted" : "",
                        selected ? "text-primary-strong" : "text-foreground",
                        option.disabled
                          ? "cursor-not-allowed text-muted-foreground/60"
                          : "",
                      )}
                    >
                      {option.dot ? (
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            option.dot,
                          )}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      {selected ? (
                        <CheckIcon
                          className="h-4 w-4 shrink-0 text-primary-strong"
                          aria-hidden="true"
                        />
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
