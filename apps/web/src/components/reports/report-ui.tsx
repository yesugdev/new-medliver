"use client";

import { useState, type ReactNode } from "react";
import {
  ChevronLeft, ChevronRight, Inbox, FileSpreadsheet, FileText, Printer, type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Export buttons ───────────────────────────────────────────────────── */
export function ExportButtons({
  onExcel,
  onCsv,
  onPrint,
}: {
  onExcel: () => void;
  onCsv: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="flex items-center gap-2" data-noprint>
      <Button variant="outline" size="sm" onClick={onExcel}>
        <FileSpreadsheet className="h-4 w-4" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={onCsv}>
        <FileText className="h-4 w-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onPrint}>
        <Printer className="h-4 w-4" /> Хэвлэх
      </Button>
    </div>
  );
}

/* ── KPI card ─────────────────────────────────────────────────────────── */
const TONES: Record<string, string> = {
  indigo:  "bg-indigo-50 text-indigo-600 border-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber:   "bg-amber-50 text-amber-600 border-amber-100",
  rose:    "bg-rose-50 text-rose-600 border-rose-100",
  sky:     "bg-sky-50 text-sky-600 border-sky-100",
  violet:  "bg-violet-50 text-violet-600 border-violet-100",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: keyof typeof TONES | string;
  hint?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        {Icon && (
          <div className={cn("h-11 w-11 rounded-xl border flex items-center justify-center shrink-0", TONES[tone] ?? TONES.indigo)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-xl font-bold tracking-tight tabular-nums truncate">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Chart / section card ─────────────────────────────────────────────── */
export function ChartCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between gap-2 py-3 px-5 border-b border-border">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────── */
export function EmptyState({ text = "Мэдээлэл байхгүй байна" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
      <Inbox className="h-9 w-9 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function ReportSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

/* ── Paginated table ──────────────────────────────────────────────────── */
export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => ReactNode;
}

export function ReportTable<T>({
  columns,
  rows,
  pageSize = 10,
  footer,
  emptyText,
}: {
  columns: Column<T>[];
  rows: T[];
  pageSize?: number;
  footer?: ReactNode;
  emptyText?: string;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = rows.slice(current * pageSize, current * pageSize + pageSize);
  const align = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  if (rows.length === 0) return <EmptyState text={emptyText} />;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th key={c.key} className={cn("py-2 px-3 font-medium text-muted-foreground text-xs", align(c.align))}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                {columns.map((c) => (
                  <td key={c.key} className={cn("py-2 px-3 tabular-nums", align(c.align))}>
                    {c.render(row, current * pageSize + i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <span>
            {current * pageSize + 1}–{Math.min((current + 1) * pageSize, rows.length)} / {rows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="h-7 w-7 flex items-center justify-center rounded-md border border-border disabled:opacity-40 hover:bg-muted"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1">{current + 1}/{pages}</span>
            <button
              className="h-7 w-7 flex items-center justify-center rounded-md border border-border disabled:opacity-40 hover:bg-muted"
              onClick={() => setPage(current + 1)}
              disabled={current >= pages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
