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
  CheckSquareIcon,
  CloseIcon,
  DashboardIcon,
  FolderIcon,
  LogOutIcon,
  MenuIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  icon: (props: { className?: string }) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/projects", label: "Projects", icon: FolderIcon },
  { href: "/tasks", label: "My Tasks", icon: CheckSquareIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon, adminOnly: true },
];

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
        T
      </span>
      <span className="text-lg font-semibold tracking-tight text-foreground">
        TaskFlow
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "ADMIN",
  );

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className="w-4" aria-hidden="true">
              <item.icon className="h-4 w-4" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard() {
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
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {fullName(user)}
          </p>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {user?.role.toLowerCase() ?? "—"}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href="/profile"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <UserIcon className="h-4 w-4" />
          Profile
        </Link>
        <Button variant="ghost" size="sm" onClick={handleLogout} disabled={busy}>
          <LogOutIcon className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          aria-label="TaskFlow dashboard"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            T
          </span>
          <span className="font-semibold text-foreground">TaskFlow</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto py-2">
          <NavLinks />
        </div>
        <UserCard />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <CloseIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <UserCard />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}