"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HeartPulse, Loader2, Plus, CheckCircle2,
  Thermometer, Activity, Wind, Droplets, Weight, Ruler,
  ChevronLeft, ChevronRight, Calendar, ArrowLeftRight, List,
} from "lucide-react";
import type { Vitals, VitalsRecord } from "@his/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { createVitalsRecord, listPatientVitals } from "@/lib/vitals-api";
import { formatTimeMn } from "@/lib/format";
import { extractApiError } from "@/lib/api";

/* ─── Form field config ─────────────────────────────────────────────── */
const FORM_FIELDS: Array<{
  key: keyof Vitals;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  min: number; max: number; step: number;
}> = [
  { key:"temperature",           label:"Температур",      unit:"°C",     icon:Thermometer, placeholder:"36.6", min:30, max:45,  step:0.1 },
  { key:"bloodPressureSystolic", label:"ЦД дээд",         unit:"mmHg",   icon:Activity,    placeholder:"120",  min:50, max:300, step:1   },
  { key:"bloodPressureDiastolic",label:"ЦД доод",         unit:"mmHg",   icon:Activity,    placeholder:"80",   min:20, max:200, step:1   },
  { key:"heartRate",             label:"Зүрхний цохилт",  unit:"/мин",   icon:HeartPulse,  placeholder:"72",   min:20, max:300, step:1   },
  { key:"respiratoryRate",       label:"Амьсгал",          unit:"/мин",   icon:Wind,        placeholder:"16",   min:0,  max:60,  step:1   },
  { key:"oxygenSaturation",      label:"SpO₂",             unit:"%",      icon:Droplets,    placeholder:"98",   min:0,  max:100, step:1   },
  { key:"weight",                label:"Жин",              unit:"кг",     icon:Weight,      placeholder:"70",   min:0,  max:500, step:0.1 },
  { key:"height",                label:"Өндөр",            unit:"см",     icon:Ruler,       placeholder:"170",  min:0,  max:300, step:0.5 },
];

/* ─── Chart metric config ───────────────────────────────────────────── */
interface ChartSeries {
  key: keyof VitalsRecord;
  color: string;
  refMin?: number;
  refMax?: number;
}

interface ChartMetric {
  id: string;
  tab: string;
  unit: string;
  series: ChartSeries[];
  fmt: (v: number) => string;
}

const CHART_METRICS: ChartMetric[] = [
  {
    id: "temp",
    tab: "T°",
    unit: "°C",
    series: [{ key: "temperature", color: "#f97316", refMin: 36.1, refMax: 37.2 }],
    fmt: (v) => v.toFixed(1),
  },
  {
    id: "bp",
    tab: "ЦД",
    unit: "mmHg",
    series: [
      { key: "bloodPressureSystolic",  color: "#ef4444", refMin: 90,  refMax: 139 },
      { key: "bloodPressureDiastolic", color: "#fca5a5", refMin: 60,  refMax: 89  },
    ],
    fmt: (v) => Math.round(v).toString(),
  },
  {
    id: "hr",
    tab: "ЗЦ",
    unit: "/мин",
    series: [{ key: "heartRate", color: "#ec4899", refMin: 60, refMax: 100 }],
    fmt: (v) => Math.round(v).toString(),
  },
  {
    id: "spo2",
    tab: "SpO₂",
    unit: "%",
    series: [{ key: "oxygenSaturation", color: "#0ea5e9", refMin: 95, refMax: 100 }],
    fmt: (v) => Math.round(v).toString(),
  },
  {
    id: "weight",
    tab: "Жин",
    unit: "кг",
    series: [{ key: "weight", color: "#8b5cf6" }],
    fmt: (v) => v.toFixed(1),
  },
];

/* ─── Sparkline SVG chart ───────────────────────────────────────────── */
function SparkChart({
  records,
  metric,
}: {
  records: VitalsRecord[];
  metric: ChartMetric;
}) {
  const primaryKey = metric.series[0].key;

  // Last 12 records that have the primary metric, oldest → newest
  const pts = useMemo(
    () =>
      [...records]
        .reverse()
        .filter((r) => r[primaryKey] != null)
        .slice(-12),
    [records, primaryKey],
  );

  if (pts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 gap-2">
        <HeartPulse className="h-8 w-8 text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground">Бүртгэл байхгүй</p>
      </div>
    );
  }

  const W = 420;
  const H = 110;
  const pad = { l: 32, r: 14, t: 20, b: 22 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  // Gather all values (including ref bounds) to determine chart Y range
  const allVals: number[] = [];
  for (const s of metric.series) {
    pts.forEach((r) => {
      const v = r[s.key] as number | undefined;
      if (v != null) allVals.push(v);
    });
    if (s.refMin != null) allVals.push(s.refMin);
    if (s.refMax != null) allVals.push(s.refMax);
  }
  if (allVals.length === 0) return null;

  const dataSpan = Math.max(...allVals) - Math.min(...allVals);
  const margin = Math.max(dataSpan * 0.18, 1.5);
  const rMin = Math.min(...allVals) - margin;
  const rMax = Math.max(...allVals) + margin;

  const xP = (i: number) =>
    pad.l + (pts.length === 1 ? cW / 2 : (i / (pts.length - 1)) * cW);
  const yP = (v: number) =>
    pad.t + cH - ((v - rMin) / (rMax - rMin)) * cH;

  const isOutOfRange = (v: number, s: ChartSeries) =>
    (s.refMin != null && v < s.refMin) || (s.refMax != null && v > s.refMax);

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
      {/* Subtle horizontal grid */}
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad.l} y1={pad.t + cH * t}
          x2={pad.l + cW} y2={pad.t + cH * t}
          stroke="#f1f5f9" strokeWidth={1}
        />
      ))}

      {/* Reference range bands + dashed boundary lines */}
      {metric.series.map((s) => (
        <React.Fragment key={s.key as string}>
          {s.refMin != null && s.refMax != null && (
            <rect
              x={pad.l} y={yP(s.refMax)}
              width={cW} height={Math.max(yP(s.refMin) - yP(s.refMax), 0)}
              fill="#22c55e" fillOpacity={0.09}
            />
          )}
          {s.refMin != null && (
            <line
              x1={pad.l} y1={yP(s.refMin)} x2={pad.l + cW} y2={yP(s.refMin)}
              stroke="#22c55e" strokeWidth={0.8} strokeDasharray="4,3"
            />
          )}
          {s.refMax != null && (
            <line
              x1={pad.l} y1={yP(s.refMax)} x2={pad.l + cW} y2={yP(s.refMax)}
              stroke="#22c55e" strokeWidth={0.8} strokeDasharray="4,3"
            />
          )}
        </React.Fragment>
      ))}

      {/* Series lines */}
      {metric.series.map((s) => {
        const pairs = pts
          .map((r, i) => ({ i, v: r[s.key] as number | undefined }))
          .filter((p): p is { i: number; v: number } => p.v != null);
        if (pairs.length < 2) return null;
        return (
          <polyline
            key={s.key as string}
            points={pairs.map((p) => `${xP(p.i)},${yP(p.v)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {/* Dots */}
      {metric.series.map((s) =>
        pts.map((r, i) => {
          const v = r[s.key] as number | undefined;
          if (v == null) return null;
          const out = isOutOfRange(v, s);
          const isLast = i === pts.length - 1;
          return (
            <circle
              key={`${s.key as string}-${i}`}
              cx={xP(i)}
              cy={yP(v)}
              r={isLast ? 4.5 : 2.5}
              fill={out ? "#ef4444" : s.color}
              stroke="white"
              strokeWidth={isLast ? 2 : 1}
            />
          );
        }),
      )}

      {/* Latest value label */}
      {(() => {
        const last = pts[pts.length - 1];
        if (!last) return null;
        const s0 = metric.series[0];
        const v = last[s0.key] as number | undefined;
        if (v == null) return null;
        const out = isOutOfRange(v, s0);
        const label =
          metric.id === "bp"
            ? `${last.bloodPressureSystolic ?? "—"}/${last.bloodPressureDiastolic ?? "—"}`
            : `${metric.fmt(v)} ${metric.unit}`;
        const lx = xP(pts.length - 1);
        return (
          <text
            x={lx}
            y={yP(v) - 9}
            textAnchor={lx > W * 0.75 ? "end" : "middle"}
            fontSize={10}
            fontWeight="700"
            fill={out ? "#ef4444" : s0.color}
          >
            {label}
          </text>
        );
      })()}

      {/* Y-axis labels */}
      <text
        x={pad.l - 3} y={pad.t + 4}
        textAnchor="end" fontSize={8} fill="#94a3b8"
      >
        {metric.fmt(rMax)}
      </text>
      <text
        x={pad.l - 3} y={pad.t + cH + 4}
        textAnchor="end" fontSize={8} fill="#94a3b8"
      >
        {metric.fmt(rMin)}
      </text>

      {/* X-axis date labels */}
      {pts.length > 1 && (
        <>
          <text x={xP(0)} y={H - 4} textAnchor="middle" fontSize={8} fill="#94a3b8">
            {fmtDate(pts[0].recordedAt)}
          </text>
          <text x={xP(pts.length - 1)} y={H - 4} textAnchor="middle" fontSize={8} fill="#94a3b8">
            {fmtDate(pts[pts.length - 1].recordedAt)}
          </text>
        </>
      )}
    </svg>
  );
}

/* ─── Metric tab button ─────────────────────────────────────────────── */
function MetricTab({
  metric,
  records,
  isActive,
  onClick,
}: {
  metric: ChartMetric;
  records: VitalsRecord[];
  isActive: boolean;
  onClick: () => void;
}) {
  const pk = metric.series[0].key;
  const latest = records.find((r) => r[pk] != null);
  const v = latest?.[pk] as number | undefined;

  let display: string;
  if (v == null) {
    display = "—";
  } else if (metric.id === "bp") {
    const dia = latest?.bloodPressureDiastolic;
    display = dia != null ? `${Math.round(v)}/${Math.round(dia)}` : metric.fmt(v);
  } else {
    display = metric.fmt(v);
  }

  const s0 = metric.series[0];
  const isOut =
    v != null &&
    ((s0.refMin != null && v < s0.refMin) || (s0.refMax != null && v > s0.refMax));

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all text-center min-w-[60px] border ${
        isActive
          ? "bg-white border-border shadow-sm"
          : "border-transparent hover:bg-white/60"
      }`}
    >
      <span className="text-[10px] text-muted-foreground mb-0.5">{metric.tab}</span>
      <span
        className={`text-sm font-semibold leading-tight tabular-nums ${
          v == null
            ? "text-muted-foreground"
            : isOut
            ? "text-rose-600"
            : "text-foreground"
        }`}
      >
        {display}
      </span>
      {v != null && (
        <span className="text-[9px] text-muted-foreground mt-0.5">{metric.unit}</span>
      )}
    </button>
  );
}

/* ─── Он-сар (period) туслах функцууд ───────────────────────────────── */
const currentMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

function shiftMonth(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(period: string): string {
  const [y, m] = period.split("-");
  return `${y} оны ${Number(m)} сар`;
}

/* ─── Он-сар навигац ────────────────────────────────────────────────── */
function PeriodNav({
  period,
  setPeriod,
  count,
}: {
  period: string;
  setPeriod: (p: string) => void;
  count: number;
}) {
  const atCurrent = period >= currentMonth();
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border">
      <button
        type="button"
        onClick={() => setPeriod(shiftMonth(period, -1))}
        title="Өмнөх сар"
        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium">{monthLabel(period)}</span>
        <span className="text-[11px] text-muted-foreground">
          {count > 0 ? `${count} бүртгэл` : "бүртгэлгүй"}
        </span>
      </div>

      <button
        type="button"
        disabled={atCurrent}
        onClick={() => setPeriod(shiftMonth(period, 1))}
        title="Дараагийн сар"
        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-white hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Харьцуулах хүснэгт (өмнөх ↔ одоогийн ↔ дараах) ────────────────── */
interface CompareRow {
  label: string;
  unit: string;
  key?: keyof VitalsRecord;
  bp?: boolean;
  dec: number;
}
const COMPARE_ROWS: CompareRow[] = [
  { label: "Температур",     unit: "°C",   key: "temperature",      dec: 1 },
  { label: "Цусны даралт",   unit: "mmHg", bp: true,                dec: 0 },
  { label: "Зүрхний цохилт", unit: "/мин", key: "heartRate",        dec: 0 },
  { label: "Амьсгал",        unit: "/мин", key: "respiratoryRate",  dec: 0 },
  { label: "SpO₂",           unit: "%",    key: "oxygenSaturation", dec: 0 },
  { label: "Жин",            unit: "кг",   key: "weight",           dec: 1 },
  { label: "Өндөр",          unit: "см",   key: "height",           dec: 1 },
];

function cellVal(r: VitalsRecord | undefined, row: CompareRow): string {
  if (!r) return "—";
  if (row.bp) {
    const s = r.bloodPressureSystolic, d = r.bloodPressureDiastolic;
    return s != null && d != null ? `${s}/${d}` : "—";
  }
  const v = r[row.key!] as number | undefined;
  return v != null ? v.toFixed(row.dec) : "—";
}

const cmpDate = (r?: VitalsRecord) =>
  r ? new Date(r.recordedAt).toLocaleDateString("mn-MN") : "—";

function CompareTable({
  prev,
  current,
  next,
}: {
  prev?: VitalsRecord;
  current?: VitalsRecord;
  next?: VitalsRecord;
}) {
  if (!current) {
    return (
      <p className="text-sm text-muted-foreground p-5 text-center">
        Харьцуулах бүртгэл алга
      </p>
    );
  }
  return (
    <div className="overflow-x-auto p-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b border-border">
            <th className="text-left py-2 px-2 font-medium">Үзүүлэлт</th>
            <th className="text-center py-2 px-2 font-medium">
              Өмнөх<div className="font-normal text-[10px] mt-0.5">{cmpDate(prev)}</div>
            </th>
            <th className="text-center py-2 px-2 font-medium text-primary">
              Одоогийн<div className="font-normal text-[10px] mt-0.5">{cmpDate(current)}</div>
            </th>
            <th className="text-center py-2 px-2 font-medium">
              Дараах<div className="font-normal text-[10px] mt-0.5">{cmpDate(next)}</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => {
            let delta: number | null = null;
            if (!row.bp && current && prev) {
              const c = current[row.key!] as number | undefined;
              const p = prev[row.key!] as number | undefined;
              if (c != null && p != null) delta = +(c - p).toFixed(row.dec);
            }
            return (
              <tr key={row.label} className="border-b border-border/40 last:border-0">
                <td className="py-2 px-2 text-muted-foreground whitespace-nowrap">
                  {row.label} <span className="text-[10px]">{row.unit}</span>
                </td>
                <td className="py-2 px-2 text-center tabular-nums">{cellVal(prev, row)}</td>
                <td className="py-2 px-2 text-center tabular-nums font-semibold bg-primary/5">
                  {cellVal(current, row)}
                  {delta != null && delta !== 0 && (
                    <span className={delta > 0 ? "text-amber-600 ml-1" : "text-sky-600 ml-1"}>
                      {delta > 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(row.dec)}
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-center tabular-nums">{cellVal(next, row)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-muted-foreground px-2 pt-2">
        ▲/▼ — өмнөх бүртгэлээс өөрчлөлт
      </p>
    </div>
  );
}

/* ─── Бүх бүртгэлийн жагсаалт ────────────────────────────────────────── */
function VitalsHistoryList({ records }: { records: VitalsRecord[] }) {
  const bp = (r: VitalsRecord) =>
    r.bloodPressureSystolic != null && r.bloodPressureDiastolic != null
      ? `${r.bloodPressureSystolic}/${r.bloodPressureDiastolic}`
      : "—";
  const num = (v?: number) => (v != null ? String(v) : "—");
  const dt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${formatTimeMn(iso)}`;
  };

  return (
    <div className="overflow-x-auto max-h-96 overflow-y-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead className="sticky top-0 bg-muted/40 z-10">
          <tr className="text-xs text-muted-foreground border-b border-border">
            <th className="text-left py-2 px-3 font-medium">Огноо</th>
            <th className="text-center py-2 px-2 font-medium">T°</th>
            <th className="text-center py-2 px-2 font-medium">ЦД</th>
            <th className="text-center py-2 px-2 font-medium">ЗЦ</th>
            <th className="text-center py-2 px-2 font-medium">Амьсгал</th>
            <th className="text-center py-2 px-2 font-medium">SpO₂</th>
            <th className="text-center py-2 px-2 font-medium">Жин</th>
            <th className="text-center py-2 px-2 font-medium">Өндөр</th>
            <th className="text-left py-2 px-3 font-medium">Бүртгэсэн</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
              <td className="py-2 px-3 font-mono text-xs">{dt(r.recordedAt)}</td>
              <td className="py-2 px-2 text-center tabular-nums">{num(r.temperature)}</td>
              <td className="py-2 px-2 text-center tabular-nums">{bp(r)}</td>
              <td className="py-2 px-2 text-center tabular-nums">{num(r.heartRate)}</td>
              <td className="py-2 px-2 text-center tabular-nums">{num(r.respiratoryRate)}</td>
              <td className="py-2 px-2 text-center tabular-nums">{num(r.oxygenSaturation)}</td>
              <td className="py-2 px-2 text-center tabular-nums">{num(r.weight)}</td>
              <td className="py-2 px-2 text-center tabular-nums">{num(r.height)}</td>
              <td className="py-2 px-3 text-xs text-violet-700">{r.recordedByName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Record form ───────────────────────────────────────────────────── */
function VitalsForm({
  patientId,
  onDone,
}: {
  patientId: string;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Record<keyof Vitals, string>>>({});

  const set = (key: keyof Vitals, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, number | string> = { patientId };
      for (const f of FORM_FIELDS) {
        const v = form[f.key];
        if (v && v.trim() !== "") payload[f.key] = parseFloat(v);
      }
      return createVitalsRecord(payload as any);
    },
    onSuccess: () => {
      toast({ title: "Амин үзүүлэлт хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["vitals", patientId] });
      onDone();
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const hasAny = FORM_FIELDS.some((f) => (form[f.key] ?? "").trim() !== "");

  return (
    <div className="p-4 bg-sky-50/50 border-t border-sky-200 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FORM_FIELDS.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Icon className="h-3 w-3 text-muted-foreground" />
                {f.label}
                <span className="text-muted-foreground">({f.unit})</span>
              </Label>
              <Input
                type="number"
                placeholder={f.placeholder}
                min={f.min}
                max={f.max}
                step={f.step}
                value={form[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={!hasAny || mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Хадгалах
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Болих
        </Button>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────── */
export function PatientVitals({
  patientId,
  withPeriodNav = false,
}: {
  patientId: string;
  /** Үзлэгийн контекстод он-сар навигац харуулах (default: тухайн сар) */
  withPeriodNav?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const canRecord = user && ["admin", "doctor", "nurse"].includes(user.role);

  const [showForm, setShowForm] = useState(false);
  const [activeMetric, setActiveMetric] = useState<string>("temp");
  const [period, setPeriod] = useState<string>(() => currentMonth());
  const [view, setView] = useState<"chart" | "compare" | "list">("chart");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["vitals", patientId],
    queryFn: () => listPatientVitals(patientId),
  });

  // Үзлэгийн контекстод сонгосон он-сараар шүүнэ; profile дээр бүгдийг харуулна
  const viewRecords = withPeriodNav
    ? records.filter((r) => r.recordedAt.slice(0, 7) === period)
    : records;

  const selectedMetric =
    CHART_METRICS.find((m) => m.id === activeMetric) ?? CHART_METRICS[0];

  // Харьцуулах — одоогийн (сонгосон сарын сүүлийн, эс бөгөөс хамгийн сүүлийн) ба
  // түүний өмнөх/дараах бүртгэл. records нь шинэ→хуучин эрэмбэтэй.
  const compareCurrent = viewRecords[0] ?? records[0];
  const curIdx = compareCurrent
    ? records.findIndex((r) => r.id === compareCurrent.id)
    : -1;
  const comparePrev = curIdx >= 0 ? records[curIdx + 1] : undefined; // өмнөх (хуучин)
  const compareNext = curIdx > 0 ? records[curIdx - 1] : undefined;  // дараах (шинэ)

  return (
    <Card>
      <CardHeader className="py-3 px-5 border-b border-border flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-rose-500" />
          Амин үзүүлэлт
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {withPeriodNav && records.length > 0 && (
            <>
              <Button
                size="sm"
                variant={view === "list" ? "default" : "outline"}
                onClick={() => setView((v) => (v === "list" ? "chart" : "list"))}
              >
                <List className="h-3.5 w-3.5" />
                Бүх бүртгэл
              </Button>
              <Button
                size="sm"
                variant={view === "compare" ? "default" : "outline"}
                onClick={() => setView((v) => (v === "compare" ? "chart" : "compare"))}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Харьцуулах
              </Button>
            </>
          )}
          {canRecord && !showForm && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5" />
              Бүртгэх
            </Button>
          )}
        </div>
      </CardHeader>

      {showForm && (
        <VitalsForm patientId={patientId} onDone={() => setShowForm(false)} />
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !withPeriodNav && records.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5 text-center">
            Амин үзүүлэлтийн бүртгэл байхгүй
          </p>
        ) : (
          <>
            {/* ── Он-сар навигац (жагсаалтаас бусад үед) ── */}
            {withPeriodNav && view !== "list" && (
              <PeriodNav period={period} setPeriod={setPeriod} count={viewRecords.length} />
            )}

            {view === "list" ? (
              <VitalsHistoryList records={records} />
            ) : view === "compare" ? (
              <CompareTable prev={comparePrev} current={compareCurrent} next={compareNext} />
            ) : viewRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5 text-center">
                {withPeriodNav
                  ? "Энэ сард амин үзүүлэлт бүртгэгдээгүй"
                  : "Амин үзүүлэлтийн бүртгэл байхгүй"}
              </p>
            ) : (
              <>
                {/* ── Metric selector tabs ── */}
                <div className="flex gap-1 px-4 py-2 bg-muted/20 border-b border-border overflow-x-auto">
                  {CHART_METRICS.map((m) => (
                    <MetricTab
                      key={m.id}
                      metric={m}
                      records={viewRecords}
                      isActive={activeMetric === m.id}
                      onClick={() => setActiveMetric(m.id)}
                    />
                  ))}
                </div>

                {/* ── Sparkline chart ── */}
                <div className="px-3 pt-3 pb-1">
                  <SparkChart records={viewRecords} metric={selectedMetric} />
                </div>

                {/* ── Latest record info strip ── */}
                {viewRecords[0] && (
                  <div className="px-5 py-2 border-t border-border/60 bg-muted/10 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {withPeriodNav ? "Энэ сарын сүүлийн:" : "Сүүлийн бүртгэл:"}{" "}
                      <span className="font-mono">
                        {formatTimeMn(viewRecords[0].recordedAt)}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-violet-700">
                      {viewRecords[0].recordedByName}
                    </span>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
