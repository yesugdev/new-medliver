"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import type { Role } from "@his/shared";
import { filterNavForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = filterNavForRole(role);

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-30 w-64 border-r border-border bg-white flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
        <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide">MEDLIVER</span>
          <span className="text-[11px] text-muted-foreground">Эмнэлгийн систем</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/settings" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-5 py-4 text-[11px] text-muted-foreground">
        MEDLIVER · v0.1.0
      </div>
    </aside>
  );
}
