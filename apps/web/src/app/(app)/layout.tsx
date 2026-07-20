"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);   // desktop collapse
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer

  return (
    <AuthGuard>
      {user ? (
        <div className="min-h-screen bg-slate-50">
          <AppSidebar
            role={user.role}
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />

          {/* Mobile overlay — only below lg when drawer is open */}
          {mobileOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/40 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Content — padded for the fixed sidebar only from lg up */}
          <div
            className={cn(
              "transition-[padding-left] duration-300 ease-in-out",
              collapsed ? "lg:pl-16" : "lg:pl-64",
            )}
          >
            <AppHeader user={user} onOpenMobile={() => setMobileOpen(true)} />
            <main className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      ) : null}
    </AuthGuard>
  );
}
