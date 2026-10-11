"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  SidebarBrand,
  SidebarNav,
  UserMenu,
} from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CloseIcon, MenuIcon } from "@/components/icons";

const EXPANDED = "212px";
const COLLAPSED = "62px";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          aria-label="TaskFlow dashboard"
        >
          <BrandMark />
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
          collapsed ? "w-[62px]" : "w-[212px]",
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
            className="absolute inset-0 bg-black/60 animate-overlay-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar shadow-xl animate-panel-in">
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
        style={
          {
            "--shell-pad": collapsed ? COLLAPSED : EXPANDED,
          } as React.CSSProperties
        }
        className="relative transition-[padding] duration-200 lg:pl-[var(--shell-pad)]"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-grid mask-fade-b opacity-40"
          aria-hidden="true"
        />
        <TopBar />
        <main className="relative mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
