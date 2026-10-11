"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  BellIcon,
  ChevronRightIcon,
  LogOutIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from "@/components/icons";

interface Crumb {
  label: string;
  href?: string;
}

function resolveCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "dashboard") {
    return [{ label: "Dashboard" }];
  }
  if (segments[0] === "projects") {
    if (segments.length > 1) {
      return [
        { label: "Projects", href: "/projects" },
        { label: "Project detail" },
      ];
    }
    return [{ label: "Projects" }];
  }
  if (segments[0] === "tasks") {
    return [{ label: "My tasks" }];
  }
  if (segments[0] === "profile") {
    return [{ label: "Profile" }];
  }
  if (segments[0] === "admin") {
    if (segments[1] === "users") {
      return [{ label: "Administration" }, { label: "Users" }];
    }
    return [{ label: "Administration" }];
  }
  return [{ label: "TaskFlow" }];
}

function TopBarUser() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-muted"
        >
          <Avatar user={user} size="sm" />
          <span className="hidden text-[13px] font-medium text-foreground xl:block">
            {user?.firstName}
          </span>
        </button>
      }
    >
      <div className="px-2.5 py-1.5">
        <p className="truncate text-[13px] font-medium text-foreground">
          {fullName(user)}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>
      <DropdownMenuSeparator />
      <Link
        href="/profile"
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <UserIcon className="h-4 w-4" />
        Profile
      </Link>
      <Link
        href="/profile"
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <SettingsIcon className="h-4 w-4" />
        Settings
      </Link>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={handleLogout}
        disabled={busy}
        className="text-destructive hover:bg-destructive/10"
      >
        <LogOutIcon className="h-4 w-4" />
        {busy ? "Signing out…" : "Sign out"}
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const crumbs = resolveCrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 hidden h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:flex xl:px-8">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-[13px]">
          {crumbs.map((crumb, index) => (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <span className="flex-1" />

      <button
        type="button"
        aria-label="Search (coming soon)"
        title="Search is coming soon"
        className={cn(
          "group hidden h-9 w-full max-w-xs items-center gap-2 rounded-md border border-border bg-surface/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong md:flex",
        )}
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left text-[13px]">Search…</span>
        <kbd className="flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        aria-label="Notifications (coming soon)"
        title="Notifications are coming soon"
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <BellIcon className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary-strong" />
      </button>

      <span className="h-6 w-px bg-border" aria-hidden="true" />

      <TopBarUser />
    </header>
  );
}
