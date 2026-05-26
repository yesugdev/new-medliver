"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HeartPulse, Loader2, CheckCircle2, Search,
  Thermometer, Activity, Wind, Droplets, Weight, Ruler, X,
} from "lucide-react";
import type { Vitals, VitalsRecord } from "@his/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { listPatients } from "@/lib/patients-api";
import { createVitalsRecord, listPatientVitals } from "@/lib/vitals-api";
import { formatTimeMn } from "@/lib/format";
import { extractApiError } from "@/lib/api";

/* ─── Field config ──────────────────────────────────────────────────── */
interface VField {
  key: keyof Vitals;
  label: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  hint: string;
  min: number; max: number; step: number;
}

const FIELDS: VField[] = [
  { key:"temperature",           label:"Биеийн температур",     unit:"°C",       icon:Thermometer, placeholder:"36.6", hint:"Хэвийн: 36.1–37.2°C",  min:30,  max:45,  step:0.1 },
  { key:"bloodPressureSystolic", label:"Цусны даралт (дээд)",   unit:"mmHg",     icon:Activity,    placeholder:"120",  hint:"Хэвийн: 90–139",       min:50,  max:300, step:1   },
  { key:"bloodPressureDiastolic",label:"Цусны даралт (доод)",   unit:"mmHg",     icon:Activity,    placeholder:"80",   hint:"Хэвийн: 60–89",        min:20,  max:200, step:1   },
  { key:"heartRate",             label:"Зүрхний цохилт",        unit:"уд/мин",   icon:HeartPulse,  placeholder:"72",   hint:"Хэвийн: 60–100",       min:20,  max:300, step:1   },
  { key:"respiratoryRate",       label:"Амьсгалын давтамж",     unit:"уд/мин",   icon:Wind,        placeholder:"16",   hint:"Хэвийн: 12–20",        min:0,   max:60,  step:1   },
  { key:"oxygenSaturation",      label:"Хүчилтөрөгч (SpO₂)",   unit:"%",        icon:Droplets,    placeholder:"98",   hint:"Хэвийн: 95–100%",      min:0,   max:100, step:1   },
  { key:"weight",                label:"Жин",                   unit:"кг",       icon:Weight,      placeholder:"70",   hint:"",                      min:0,   max:500, step:0.1 },
  { key:"height",                label:"Өндөр",                 unit:"см",       icon:Ruler,       placeholder:"170",  hint:"",                      min:0,   max:300, step:0.5 },
];

type FormValues = Partial<Record<keyof Vitals, string>>;

function formatSummary(r: VitalsRecord): string {
  const parts: string[] = [];
  if (r.temperature)           parts.push(`${r.temperature}°C`);
  if (r.bloodPressureSystolic && r.bloodPressureDiastolic)
    parts.push(`${r.bloodPressureSystolic}/${r.bloodPressureDiastolic} mmHg`);
  if (r.heartRate)             parts.push(`${r.heartRate} уд/мин`);
  if (r.oxygenSaturation)      parts.push(`SpO₂ ${r.oxygenSaturation}%`);
  if (r.weight)                parts.push(`${r.weight} кг`);
  if (r.height)                parts.push(`${r.height} см`);
  return parts.join(" · ") || "—";
}

/* ─── Vitals history card ───────────────────────────────────────────── */
function VitalsHistory({ patientId }: { patientId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["vitals", patientId],
    queryFn: () => listPatientVitals(patientId),
  });

  if (isLoading) return (
    <div className="flex justify-center py-6">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  if (data.length === 0) return (
    <p className="text-sm text-muted-foreground py-4 text-center">Амин үзүүлэлтийн түүх байхгүй</p>
  );

  return (
    <div className="divide-y divide-border max-h-72 overflow-y-auto">
      {data.map((r) => (
        <div key={r.id} className="px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono">{formatTimeMn(r.recordedAt)}</span>
            <span className="text-xs font-medium text-violet-700">{r.recordedByName}</span>
          </div>
          <p className="text-foreground leading-relaxed">{formatSummary(r)}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function VitalsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  /* Patient search */
  const [search, setSearch]         = useState("");
  const [patientId, setPatientId]   = useState("");
  const [patientName, setPatientName] = useState("");
  const [form, setForm]             = useState<FormValues>({});

  const patients = useQuery({
    queryKey: ["patient-search", search],
    queryFn: () => listPatients({ search, pageSize: 8 }),
    enabled: search.length > 1,
  });

  const set = (key: keyof Vitals, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = { patientId };
      for (const f of FIELDS) {
        const v = form[f.key];
        if (v && v.trim() !== "") payload[f.key] = parseFloat(v);
      }
      return createVitalsRecord(payload as any);
    },
    onSuccess: () => {
      toast({ title: "Амин үзүүлэлт хадгалагдлаа", variant: "success" });
      setForm({});
      qc.invalidateQueries({ queryKey: ["vitals", patientId] });
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const hasAnyValue = FIELDS.some((f) => (form[f.key] ?? "").trim() !== "");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-rose-500" />
          Амин үзүүлэлт бүртгэх
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Өвчтөнийг хайж олоод амин үзүүлэлтийг бүртгэнэ
        </p>
      </div>

      {/* ── Reference strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Температур",     value: "36.1–37.2°C",   color: "text-orange-700 bg-orange-50 border-orange-200" },
          { label: "Цусны даралт",   value: "90–139/60–89",  color: "text-red-700 bg-red-50 border-red-200" },
          { label: "Зүрхний цохилт", value: "60–100/мин",    color: "text-rose-700 bg-rose-50 border-rose-200" },
          { label: "SpO₂",           value: "95–100%",       color: "text-sky-700 bg-sky-50 border-sky-200" },
        ].map((r) => (
          <div key={r.label} className={`rounded-lg px-3 py-2 text-xs border ${r.color}`}>
            <div className="font-semibold">{r.label}</div>
            <div className="opacity-80 mt-0.5">{r.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: patient picker ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Өвчтөн сонгох</CardTitle>
            </CardHeader>
            <CardContent>
              {patientId ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-md border bg-muted/30 text-sm font-medium">
                    {patientName}
                  </div>
                  <Button variant="ghost" size="sm"
                    onClick={() => { setPatientId(""); setPatientName(""); setSearch(""); setForm({}); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Нэр эсвэл регистрийн дугаар..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {patients.data?.items.length ? (
                    <div className="border rounded-md divide-y mt-2 max-h-52 overflow-y-auto">
                      {patients.data.items.map((p) => (
                        <button key={p.id} type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm transition-colors"
                          onClick={() => {
                            setPatientId(p.id);
                            setPatientName(`${p.lastName} ${p.firstName} · ${p.patientCode}`);
                            setSearch("");
                          }}>
                          <div className="font-medium">{p.lastName} {p.firstName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {p.patientCode} · {p.phone}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : search.length > 1 && !patients.isLoading ? (
                    <p className="text-xs text-muted-foreground mt-2 text-center">Өвчтөн олдсонгүй</p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {/* Vitals history for selected patient */}
          {patientId && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Өмнөх бүртгэлүүд</CardTitle>
              </CardHeader>
              <VitalsHistory patientId={patientId} />
            </Card>
          )}
        </div>

        {/* ── Right: vitals form ────────────────────────────────── */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Амин үзүүлэлт</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!patientId ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <HeartPulse className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Өвчтөн сонгоно уу</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {FIELDS.map((f) => {
                      const Icon = f.icon;
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="text-xs flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {f.label}
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number"
                              placeholder={f.placeholder}
                              min={f.min} max={f.max} step={f.step}
                              value={form[f.key] ?? ""}
                              onChange={(e) => set(f.key, e.target.value)}
                              className="h-9 text-sm"
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap w-14 shrink-0">
                              {f.unit}
                            </span>
                          </div>
                          {f.hint && (
                            <p className="text-[10px] text-muted-foreground">{f.hint}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <Button
                      onClick={() => mutation.mutate()}
                      disabled={!hasAnyValue || mutation.isPending}
                    >
                      {mutation.isPending
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <CheckCircle2 className="h-4 w-4" />}
                      Хадгалах
                    </Button>
                    <Button variant="ghost" onClick={() => setForm({})}>
                      Арилгах
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
