"use client";

import { useState } from "react";
import { BarChart3, Users, FlaskConical, Wallet } from "lucide-react";
import type { ReportRange } from "@his/shared";
import { ROLES } from "@his/shared";
import { AuthGuard } from "@/components/auth-guard";
import { ReportFilter } from "@/components/reports/report-filter";
import { PatientReportView } from "./patient-report";
import { LaboratoryReportView } from "./laboratory-report";
import { FinancialReportView } from "./financial-report";
import { cn } from "@/lib/utils";

type Tab = "patient" | "laboratory" | "financial";

const TABS: { value: Tab; label: string; icon: typeof Users }[] = [
  { value: "patient",    label: "Өвчтөн",    icon: Users },
  { value: "laboratory", label: "Лаборатори", icon: FlaskConical },
  { value: "financial",  label: "Санхүү",    icon: Wallet },
];

function ReportsInner() {
  const [tab, setTab] = useState<Tab>("patient");
  const [range, setRange] = useState<ReportRange | null>(null);

  return (
    <div className="space-y-5 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Тайлан
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Өвчтөн, лаборатори, санхүүгийн статистик — realtime aggregate
          </p>
        </div>
        <ReportFilter onChange={setRange} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                tab === t.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {range && (
        <>
          {tab === "patient" && <PatientReportView range={range} />}
          {tab === "laboratory" && <LaboratoryReportView range={range} />}
          {tab === "financial" && <FinancialReportView range={range} />}
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AuthGuard allowedRoles={[ROLES.ADMIN]}>
      <ReportsInner />
    </AuthGuard>
  );
}
