"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthGuard>
      {user ? (
        <div className="min-h-screen bg-slate-50">
          <AppSidebar
            role={user.role}
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
          />
          <div
            className={cn(
              "transition-[padding-left] duration-300 ease-in-out",
              collapsed ? "pl-16" : "pl-64",
            )}
          >
            <AppHeader user={user} />
            <main className="px-6 py-6">{children}</main>
          </div>
        </div>
      ) : null}
    </AuthGuard>
  );
}
