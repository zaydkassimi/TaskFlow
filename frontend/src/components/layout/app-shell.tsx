"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BrandMark,
  SidebarBrand,
  SidebarNav,
  UserMenu,
} from "@/components/layout/sidebar";
import { CloseIcon, MenuIcon } from "@/components/icons";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          aria-label="TaskFlow dashboard"
        >
          <BrandMark className="h-7 w-7 text-sm" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            TaskFlow
          </span>
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

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        <SidebarBrand
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />
        <SidebarNav collapsed={collapsed} />
        <UserMenu
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <div className="flex-1">
                <SidebarBrand />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              >
                <CloseIcon className="h-5 w-5" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <UserMenu />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "transition-[padding] duration-200",
          collapsed ? "lg:pl-[68px]" : "lg:pl-60",
        )}
      >
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}