"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  CheckSquareIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DashboardIcon,
  FolderIcon,
  LogOutIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  icon: (props: { className?: string }) => React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
      { href: "/projects", label: "Projects", icon: FolderIcon },
      { href: "/tasks", label: "My Tasks", icon: CheckSquareIcon },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/users", label: "Users", icon: UsersIcon, adminOnly: true },
    ],
  },
];

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[15px] font-bold text-primary-foreground shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      T
    </span>
  );
}

export function SidebarBrand({
  collapsed,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-14 items-center border-b border-sidebar-border",
        collapsed ? "justify-center" : "gap-2.5 px-4",
      )}
    >
      <Link
        href="/dashboard"
        className="flex min-w-0 items-center gap-2.5"
        aria-label="TaskFlow dashboard"
      >
        <BrandMark />
        {!collapsed ? (
          <span className="truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
            TaskFlow
          </span>
        ) : null}
      </Link>
      {!collapsed ? (
        <>
          <span className="flex-1" />
          {onToggle ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="h-7 w-7 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3"
      aria-label="Main navigation"
    >
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter(
          (item) => !item.adminOnly || user?.role === "ADMIN",
        );
        if (items.length === 0) {
          return null;
        }
        return (
          <div key={group.label} className="flex flex-col gap-0.5">
            {collapsed ? (
              <div className="mx-3 mb-1 h-px bg-sidebar-border" />
            ) : (
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">
                {group.label}
              </p>
            )}
            {items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "px-3",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className="flex w-4 shrink-0 justify-center"
                    aria-hidden="true"
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export function UserMenu({
  collapsed,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
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

  const trigger = collapsed ? (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Account menu"
      className="text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
    >
      <Avatar user={user} size="sm" />
    </Button>
  ) : (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-hover"
    >
      <Avatar user={user} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-sidebar-foreground">
          {fullName(user)}
        </span>
        <span className="block truncate text-xs capitalize text-sidebar-muted">
          {user?.role.toLowerCase() ?? "—"}
        </span>
      </span>
      <ChevronDownIcon className="h-4 w-4 shrink-0 text-sidebar-muted" />
    </button>
  );

  return (
    <div className="border-t border-sidebar-border p-2">
      {collapsed && onToggle ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="mb-1 flex w-full text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      ) : null}
      <DropdownMenu
        align="start"
        className={cn(collapsed ? "flex justify-center" : "block w-full")}
        trigger={trigger}
      >
        <Link
          href="/profile"
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <UserIcon className="h-4 w-4" />
          Profile
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
    </div>
  );
}