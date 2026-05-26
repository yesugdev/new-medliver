"use client";

import { LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@his/shared";
import { ROLE_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export function AppHeader({ user }: { user: AuthUser }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString("mn-MN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium">{user.fullName}</div>
            <div className="text-[11px] text-muted-foreground">
              {ROLE_LABELS_MN[user.role]}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Гарах
        </Button>
      </div>
    </header>
  );
}
