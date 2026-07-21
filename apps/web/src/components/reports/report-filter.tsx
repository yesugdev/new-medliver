"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  addDays, addMonths, addYears, format,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReportPeriod, ReportRange } from "@his/shared";
import { Input } from "@/components/ui/input";
import { toDateInput } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRESETS: { value: ReportPeriod; label: string }[] = [
  { value: "day",    label: "Өдөр" },
  { value: "week",   label: "7 хоног" },
  { value: "month",  label: "Сар" },
  { value: "year",   label: "Жил" },
  { value: "custom", label: "Custom" },
];

function computeRange(period: ReportPeriod, anchor: Date, customFrom: string, customTo: string): ReportRange {
  switch (period) {
    case "day":
      return { from: toDateInput(anchor), to: toDateInput(anchor) };
    case "week":
      return { from: toDateInput(addDays(anchor, -6)), to: toDateInput(anchor) };
    case "month":
      return { from: toDateInput(startOfMonth(anchor)), to: toDateInput(endOfMonth(anchor)) };
    case "year":
      return { from: toDateInput(startOfYear(anchor)), to: toDateInput(endOfYear(anchor)) };
    case "custom":
      return { from: customFrom, to: customTo };
  }
}

function anchorLabel(period: ReportPeriod, anchor: Date): string {
  switch (period) {
    case "day":   return format(anchor, "yyyy-MM-dd");
    case "week":  return `${format(addDays(anchor, -6), "MM-dd")} – ${format(anchor, "MM-dd")}`;
    case "month": return `${anchor.getFullYear()} оны ${anchor.getMonth() + 1}-р сар`;
    case "year":  return `${anchor.getFullYear()} он`;
    default:      return "";
  }
}

export function ReportFilter({ onChange }: { onChange: (range: ReportRange) => void }) {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [customFrom, setCustomFrom] = useState(toDateInput(addDays(new Date(), -30)));
  const [customTo, setCustomTo]     = useState(toDateInput(new Date()));

  const range = useMemo(
    () => computeRange(period, anchor, customFrom, customTo),
    [period, anchor, customFrom, customTo],
  );

  useEffect(() => {
    if (range.from && range.to) onChange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to]);

  const shift = (dir: 1 | -1) => {
    setAnchor((a) => {
      switch (period) {
        case "day":   return addDays(a, dir);
        case "week":  return addDays(a, dir * 7);
        case "month": return addMonths(a, dir);
        case "year":  return addYears(a, dir);
        default:      return a;
      }
    });
  };

  const showNav = period !== "custom";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => { setPeriod(p.value); if (p.value !== "custom") setAnchor(new Date()); }}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              period === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {showNav ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted"
            aria-label="Өмнөх"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[150px] text-center text-sm font-medium tabular-nums">
            {anchorLabel(period, anchor)}
          </span>
          <button
            onClick={() => shift(1)}
            className="h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted"
            aria-label="Дараах"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-9 w-auto" />
          <span className="text-muted-foreground text-sm">—</span>
          <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-9 w-auto" />
        </div>
      )}
    </div>
  );
}
