"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Role } from "@his/shared";
import { useAuthStore } from "@/stores/auth-store";
import { meRequest } from "@/lib/auth-api";

export function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const router = useRouter();
  const { user, accessToken, setUser, logout } = useAuthStore();

  const { isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: meRequest,
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  useEffect(() => {
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, allowedRoles, router]);

  if (!accessToken) return null;
  if (!user || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}
