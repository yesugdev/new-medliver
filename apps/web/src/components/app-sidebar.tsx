"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Role } from "@his/shared";
import { filterNavForRole, REPORTS_NAV_ITEM } from "@/lib/navigation";
import { getHospitalConfig } from "@/lib/hospital-config-api";
import { getReportAccess } from "@/lib/report-access-api";
import { ROLES } from "@his/shared";
import { cn } from "@/lib/utils";

export function AppSidebar({
  role,
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  const { data: reportAccess } = useQuery({
    queryKey: ["report-access"],
    queryFn: getReportAccess,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Тайлан цэс: admin үргэлж, бусад role тохиргоонд орсон бол
  const canSeeReports =
    role === ROLES.ADMIN || (reportAccess?.roles ?? []).includes(role);
  const items = canSeeReports
    ? [...filterNavForRole(role), REPORTS_NAV_ITEM]
    : filterNavForRole(role);

  const { data: branding } = useQuery({
    queryKey: ["hospital-config"],
    queryFn: getHospitalConfig,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const hospitalName = branding?.name || "MEDLIVER";
  const logoSrc      = branding?.logoBase64;
  const faviconSrc   = branding?.faviconBase64;

  useEffect(() => {
    if (!faviconSrc) return;
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (link) {
      link.href = faviconSrc;
    } else {
      const el = document.createElement("link");
      el.rel = "icon";
      el.href = faviconSrc;
      document.head.appendChild(el);
    }
  }, [faviconSrc]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 lg:z-30 border-r border-border bg-white flex flex-col",
        "w-64 transition-transform duration-300 ease-in-out",
        // Mobile: off-canvas drawer
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible, width driven by collapse
        "lg:translate-x-0 lg:transition-[width]",
        collapsed ? "lg:w-16" : "lg:w-64",
      )}
    >
      {/* ── Logo header ──────────────────────────────── */}
      <div className="h-16 flex items-center border-b border-border px-3 gap-2 relative overflow-visible">
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoSrc}
            alt={hospitalName}
            className={cn("object-contain shrink-0", collapsed ? "lg:h-8 lg:w-8 h-9 max-w-[140px]" : "h-9 max-w-[140px]")}
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Activity className="h-5 w-5" />
          </div>
        )}

        {/* Brand text — hidden only when collapsed on desktop */}
        {!logoSrc && (
          <div
            className={cn(
              "flex flex-col leading-tight overflow-hidden transition-all duration-300 w-full opacity-100",
              collapsed && "lg:w-0 lg:opacity-0",
            )}
          >
            <span className="text-sm font-bold tracking-wide whitespace-nowrap">{hospitalName}</span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">Эмнэлгийн систем</span>
          </div>
        )}

        {/* Desktop collapse toggle — hidden on mobile */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Sidebar нээх" : "Sidebar хаах"}
          className={cn(
            "hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-50",
            "h-7 w-7 rounded-full border border-border bg-white shadow-md",
            "items-center justify-center",
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
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-md py-2 px-3 text-sm transition-colors",
                    collapsed && "lg:justify-center lg:px-2",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-all duration-300 w-full opacity-100",
                      collapsed && "lg:w-0 lg:opacity-0",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>

                {/* Tooltip — desktop-collapsed only */}
                {collapsed && (
                  <div
                    className={cn(
                      "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50",
                      "hidden lg:block rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white whitespace-nowrap shadow-lg",
                      "opacity-0 group-hover/item:opacity-100 transition-opacity duration-150",
                    )}
                  >
                    {item.label}
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
          "border-t border-border py-4 px-5 text-[11px] text-muted-foreground overflow-hidden",
          collapsed && "lg:px-2 lg:text-center",
        )}
      >
        <span className="whitespace-nowrap">{hospitalName} · v0.1.0</span>
      </div>
    </aside>
  );
}
