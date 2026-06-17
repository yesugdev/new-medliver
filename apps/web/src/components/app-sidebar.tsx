"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import type { Role } from "@his/shared";
import { filterNavForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar({
  role,
  collapsed,
  onToggle,
}: {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const items = filterNavForRole(role);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-30 border-r border-border bg-white flex flex-col",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* ── Logo header ──────────────────────────────── */}
      <div className="h-16 flex items-center border-b border-border px-3 gap-2 relative overflow-visible">
        {/* Logo icon — always visible */}
        <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Activity className="h-5 w-5" />
        </div>

        {/* Brand text — hidden when collapsed */}
        <div
          className={cn(
            "flex flex-col leading-tight overflow-hidden transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-full opacity-100",
          )}
        >
          <span className="text-sm font-bold tracking-wide whitespace-nowrap">MEDLIVER</span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">Эмнэлгийн систем</span>
        </div>

        {/* ── Floating toggle button ── */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Sidebar нээх" : "Sidebar хаах"}
          className={cn(
            "absolute -right-3.5 top-1/2 -translate-y-1/2 z-50",
            "h-7 w-7 rounded-full border border-border bg-white shadow-md",
            "flex items-center justify-center",
            "hover:bg-muted hover:shadow-lg transition-all duration-150",
          )}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronLeft  className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/settings" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;

            return (
              <li key={item.href} className="relative group/item">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md py-2 text-sm transition-colors",
                    collapsed ? "justify-center px-2" : "px-3",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />

                  {/* Label — hidden when collapsed */}
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-all duration-300",
                      collapsed ? "w-0 opacity-0" : "w-full opacity-100",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>

                {/* Tooltip — shown only when collapsed */}
                {collapsed && (
                  <div
                    className={cn(
                      "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50",
                      "rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white whitespace-nowrap shadow-lg",
                      "opacity-0 group-hover/item:opacity-100 transition-opacity duration-150",
                    )}
                  >
                    {item.label}
                    {/* Arrow */}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Footer ───────────────────────────────────── */}
      <div
        className={cn(
          "border-t border-border py-4 text-[11px] text-muted-foreground overflow-hidden transition-all duration-300",
          collapsed ? "px-2 text-center" : "px-5",
        )}
      >
        {collapsed ? (
          <span className="font-mono text-[10px]">v0.1</span>
        ) : (
          <span className="whitespace-nowrap">MEDLIVER · v0.1.0</span>
        )}
      </div>
    </aside>
  );
}
