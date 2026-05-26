"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { useAuthStore } from "@/stores/auth-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  return (
    <AuthGuard>
      {user ? (
        <div className="min-h-screen bg-slate-50">
          <AppSidebar role={user.role} />
          <div className="pl-64">
            <AppHeader user={user} />
            <main className="px-6 py-6">{children}</main>
          </div>
        </div>
      ) : null}
    </AuthGuard>
  );
}
