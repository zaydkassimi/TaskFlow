"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand";
import { Avatar } from "@/components/ui/avatar";
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
        "flex h-14 shrink-0 items-center border-b border-sidebar-border",
        collapsed ? "justify-center px-0" : "gap-2.5 px-3.5",
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
      {!collapsed && onToggle ? (
        <>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
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
      className="flex flex-1 flex-col gap-5 overflow-y-auto px-2.5 py-4"
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
              <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted/80">
                {group.label}
              </p>
            )}
            {items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center rounded-md py-1.5 text-[13px] font-medium transition-colors duration-150",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                    active
                      ? "text-sidebar-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
                  )}
                >
                  {active && !collapsed ? (
                    <span
                      className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(94,106,210,0.8)]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-md transition-colors",
                      collapsed
                        ? cn(
                            "h-8 w-8",
                            active
                              ? "bg-sidebar-accent text-primary-strong"
                              : "text-sidebar-muted group-hover:bg-sidebar-hover group-hover:text-sidebar-foreground",
                          )
                        : "",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active
                          ? "text-primary-strong"
                          : "group-hover:text-sidebar-foreground",
                      )}
                    />
                  </span>
                  {!collapsed ? (
                    <span className="truncate">{item.label}</span>
                  ) : null}
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

  const trigger = (
    <button
      type="button"
      className={cn(
        "flex w-full items-center rounded-md text-left transition-colors hover:bg-sidebar-hover",
        collapsed ? "justify-center px-0 py-1.5" : "gap-2.5 px-2 py-1.5",
      )}
    >
      <Avatar user={user} size="sm" />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-sidebar-foreground">
              {fullName(user)}
            </span>
            <span className="block truncate text-[11px] capitalize text-sidebar-muted">
              {user?.role.toLowerCase() ?? "—"}
            </span>
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 text-sidebar-muted" />
        </>
      ) : null}
    </button>
  );

  return (
    <div className="border-t border-sidebar-border p-2.5">
      {collapsed && onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="mb-1 flex h-8 w-full items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      ) : null}
      <DropdownMenu align="start" className="block w-full" trigger={trigger}>
        <div className="px-2.5 py-1.5">
          <p className="truncate text-[13px] font-medium text-foreground">
            {fullName(user)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <Link
          href="/profile"
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <UserIcon className="h-4 w-4" />
          Profile & settings
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
