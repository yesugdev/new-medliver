"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HeartPulse, Loader2, Plus, CheckCircle2,
  Thermometer, Activity, Wind, Droplets, Weight, Ruler,
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
export function PatientVitals({ patientId }: { patientId: string }) {
  const user = useAuthStore((s) => s.user);
  const canRecord = user && ["admin", "doctor", "nurse"].includes(user.role);

  const [showForm, setShowForm] = useState(false);
  const [activeMetric, setActiveMetric] = useState<string>("temp");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["vitals", patientId],
    queryFn: () => listPatientVitals(patientId),
  });

  const selectedMetric =
    CHART_METRICS.find((m) => m.id === activeMetric) ?? CHART_METRICS[0];

  return (
    <Card>
      <CardHeader className="py-3 px-5 border-b border-border flex-row items-center justify-between gap-2">
        <CardTitle className="text-base flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-rose-500" />
          Амин үзүүлэлт
        </CardTitle>
        {canRecord && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Бүртгэх
          </Button>
        )}
      </CardHeader>

      {showForm && (
        <VitalsForm patientId={patientId} onDone={() => setShowForm(false)} />
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground p-5 text-center">
            Амин үзүүлэлтийн бүртгэл байхгүй
          </p>
        ) : (
          <>
            {/* ── Metric selector tabs ── */}
            <div className="flex gap-1 px-4 py-2 bg-muted/20 border-b border-border overflow-x-auto">
              {CHART_METRICS.map((m) => (
                <MetricTab
                  key={m.id}
                  metric={m}
                  records={records}
                  isActive={activeMetric === m.id}
                  onClick={() => setActiveMetric(m.id)}
                />
              ))}
            </div>

            {/* ── Sparkline chart ── */}
            <div className="px-3 pt-3 pb-1">
              <SparkChart records={records} metric={selectedMetric} />
            </div>

            {/* ── Latest record info strip ── */}
            {records[0] && (
              <div className="px-5 py-2 border-t border-border/60 bg-muted/10 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Сүүлийн бүртгэл:{" "}
                  <span className="font-mono">
                    {formatTimeMn(records[0].recordedAt)}
                  </span>
                </span>
                <span className="text-xs font-semibold text-violet-700">
                  {records[0].recordedByName}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
