"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Search, AlertCircle, ChevronDown, Save } from "lucide-react";
import type { DiagnosisEntry, ClinicalScore } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { searchIcd } from "@/lib/icd10-list";
import {
  getPatientDiagnoses,
  createPatientDiagnosis,
  deletePatientDiagnosis,
  getPatientClinicalScores,
  createClinicalScore,
  deleteClinicalScore,
} from "@/lib/diagnoses-api";

/* ─── Helpers ────────────────────────────────────────────────────── */

function today() { return new Date().toISOString().slice(0, 10); }

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" }); }
  catch { return iso; }
}

const emptyEntry = (): DiagnosisEntry => ({ code: "", name: "", notes: "" });

/* ─── Tab bar ────────────────────────────────────────────────────── */

function Tabs({ active, onChange }: { active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex border-b border-border mb-4">
      {["Онош", "Онош нэмэх", "Эмнэл зүйн оноо"].map((l, i) => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className={cn("px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            active === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {l}
        </button>
      ))}
    </div>
  );
}

/* ─── ICD Combobox ───────────────────────────────────────────────── */

function IcdCombobox({ value, onChange, placeholder, required }: {
  value: DiagnosisEntry;
  onChange: (v: DiagnosisEntry) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value.name ? (value.code ? `${value.code} – ${value.name}` : value.name) : "");
  const results = searchIcd(query);
  const ref = useRef<HTMLDivElement>(null);

  const handleSelect = (code: string, name: string) => {
    onChange({ ...value, code, name });
    setQuery(`${code} – ${name}`);
    setOpen(false);
  };

  const handleChange = (text: string) => {
    setQuery(text);
    onChange({ ...value, code: "", name: text });
    setOpen(true);
  };

  return (
    <div ref={ref} className="relative flex gap-1">
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.length >= 1 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? "ICD код эсвэл оношийн нэр"}
        required={required}
        className="flex-1 h-9 rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); }}
        className="h-9 w-9 flex items-center justify-center rounded border border-border bg-primary text-white hover:bg-primary/90"
      >
        <Search className="h-3.5 w-3.5" />
      </button>
      {open && results.length > 0 && (
        <div className="absolute top-10 left-0 z-50 w-full max-h-52 overflow-y-auto bg-popover border border-border rounded-md shadow-lg">
          {results.map((icd) => (
            <div key={icd.code}
              onMouseDown={() => handleSelect(icd.code, icd.name)}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted"
            >
              <span className="font-mono text-xs text-muted-foreground shrink-0 w-14">{icd.code}</span>
              <span>{icd.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tab 1: Diagnosis list ──────────────────────────────────────── */

function DiagnosisList({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["diagnoses", patientId], queryFn: () => getPatientDiagnoses(patientId) });

  const del = useMutation({
    mutationFn: (id: string) => deletePatientDiagnosis(patientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diagnoses", patientId] }),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!data?.length) return (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-sm">
      <AlertCircle className="h-5 w-5" />Мэдээлэл байхгүй байна
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/60 text-center">
            {["ОГНОО", "ОНОШ", "НОТЛОХ ОНОШ", "ТЭМДЭГЛЭЛ", ""].map((h) => (
              <th key={h} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground border border-border">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((rec) => (
            <tr key={rec.id} className="border-b border-border hover:bg-muted/20">
              <td className="px-3 py-2 border border-border whitespace-nowrap text-muted-foreground">{formatDate(rec.date)}</td>
              <td className="px-3 py-2 border border-border">
                {rec.primary.code && <span className="font-mono text-xs text-muted-foreground mr-1">{rec.primary.code}</span>}
                <span className="font-medium">{rec.primary.name}</span>
              </td>
              <td className="px-3 py-2 border border-border">
                {rec.comorbidities.map((c, i) => (
                  <div key={i} className="text-sm">
                    {c.code && <span className="font-mono text-xs text-muted-foreground mr-1">{c.code}</span>}
                    {c.name}
                  </div>
                ))}
              </td>
              <td className="px-3 py-2 border border-border text-muted-foreground text-xs">
                {rec.primary.notes}
              </td>
              <td className="px-3 py-2 border border-border text-center">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => del.mutate(rec.id)} disabled={del.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Tab 2: Add diagnosis ───────────────────────────────────────── */

function AddDiagnosis({ patientId, onSaved }: { patientId: string; onSaved: () => void }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(today());
  const [primary, setPrimary] = useState<DiagnosisEntry>(emptyEntry());
  const [comorbidities, setComorbidities] = useState<DiagnosisEntry[]>([emptyEntry()]);

  const save = useMutation({
    mutationFn: () => createPatientDiagnosis(patientId, {
      date,
      primary,
      comorbidities: comorbidities.filter((c) => c.name.trim()),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["diagnoses", patientId] });
      setPrimary(emptyEntry()); setComorbidities([emptyEntry()]); setDate(today());
      onSaved();
    },
  });

  const updateComorbidity = (i: number, v: Partial<DiagnosisEntry>) =>
    setComorbidities((prev) => prev.map((c, idx) => idx === i ? { ...c, ...v } : c));

  return (
    <div className="space-y-5">
      {/* Date */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground w-36">Огноо</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="h-9 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>

      {/* Primary */}
      <div className="space-y-2">
        <label className="text-sm font-medium"><span className="text-destructive">*</span> Үндсэн онош</label>
        <IcdCombobox value={primary} onChange={setPrimary} required />
        <textarea rows={3} value={primary.notes ?? ""} onChange={(e) => setPrimary({ ...primary, notes: e.target.value })}
          placeholder="Үндсэн оношийн тэмдэглэл"
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>

      {/* Comorbidities */}
      {comorbidities.map((c, i) => (
        <div key={i} className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Дагалдах онош {i + 1}</span>
            {comorbidities.length > 1 && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                onClick={() => setComorbidities((prev) => prev.filter((_, idx) => idx !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <IcdCombobox value={c} onChange={(v) => updateComorbidity(i, v)} />
          <textarea rows={2} value={c.notes ?? ""} onChange={(e) => updateComorbidity(i, { notes: e.target.value })}
            placeholder="Дагалдах оношийн тэмдэглэл"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="default" size="sm" type="button"
          onClick={() => setComorbidities((prev) => [...prev, emptyEntry()])}>
          <Plus className="h-4 w-4" />Нэмэх
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" type="button"
            onClick={() => { setPrimary(emptyEntry()); setComorbidities([emptyEntry()]); setDate(today()); }}>
            Цуцлах
          </Button>
          <Button size="sm" className="bg-destructive hover:bg-destructive/90" type="button"
            onClick={() => save.mutate()} disabled={save.isPending || !primary.name.trim()}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Хадгалах
          </Button>
        </div>
      </div>
      {save.isSuccess && <p className="text-xs text-green-600">Амжилттай хадгаллаа.</p>}
    </div>
  );
}

/* ─── Clinical score card ────────────────────────────────────────── */

function ScoreCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-border overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/60 transition-colors text-left">
        <span className={cn("h-5 w-5 flex items-center justify-center rounded border border-border text-xs font-bold transition-transform",
          open ? "bg-primary text-white border-primary" : "bg-background")}>
          {open ? "–" : "+"}
        </span>
        <span className="text-xs font-semibold tracking-wide uppercase">{title}</span>
      </button>
      {open && <div className="p-4 border-t border-border">{children}</div>}
    </div>
  );
}

/* ─── MELD Score calculator ──────────────────────────────────────── */

function calcMeld(creatinine: number, bilirubin: number, inr: number): number {
  const cr = Math.min(Math.max(creatinine, 1), 4);
  const bi = Math.max(bilirubin, 1);
  const ir = Math.max(inr, 1);
  return Math.round(3.78 * Math.log(bi) + 11.2 * Math.log(ir) + 9.57 * Math.log(cr) + 6.43);
}

function meldInterpretation(score: number): string {
  if (score < 10) return `${score} – Бага (3 сарын нас баралт ~2%)`;
  if (score < 20) return `${score} – Дунд (3 сарын нас баралт ~6%)`;
  if (score < 30) return `${score} – Хүнд (3 сарын нас баралт ~20%)`;
  if (score < 40) return `${score} – Маш хүнд (3 сарын нас баралт ~53%)`;
  return `${score} – Аюултай (3 сарын нас баралт ~71%)`;
}

function MeldCalculator({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [cr, setCr] = useState("");
  const [bi, setBi] = useState("");
  const [inr, setInr] = useState("");
  const [dialysis, setDialysis] = useState(false);

  const crVal = dialysis ? 4 : parseFloat(cr) || 0;
  const biVal = parseFloat(bi) || 0;
  const inrVal = parseFloat(inr) || 0;
  const canCalc = crVal > 0 && biVal > 0 && inrVal > 0;
  const score = canCalc ? calcMeld(crVal, biVal, inrVal) : null;

  const { data: scores } = useQuery({ queryKey: ["clinical-scores", patientId], queryFn: () => getPatientClinicalScores(patientId) });
  const meldHistory = scores?.filter((s) => s.type === "meld") ?? [];

  const save = useMutation({
    mutationFn: () => createClinicalScore(patientId, {
      date: today(), type: "meld",
      inputs: { creatinine: crVal, bilirubin: biVal, inr: inrVal, dialysis: dialysis ? 1 : 0 },
      score: score!, interpretation: meldInterpretation(score!),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical-scores", patientId] }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <NumField label="Креатинин (мг/дл)" value={cr} onChange={setCr} disabled={dialysis} placeholder="0.0" />
        <NumField label="Билирубин (мг/дл)" value={bi} onChange={setBi} placeholder="0.0" />
        <NumField label="INR" value={inr} onChange={setInr} placeholder="1.0" />
        <div className="flex items-center gap-2 pt-4">
          <input type="checkbox" id="dialysis" checked={dialysis} onChange={(e) => setDialysis(e.target.checked)} className="h-4 w-4 rounded border-border" />
          <label htmlFor="dialysis" className="text-sm">Диализ (Cr = 4.0 авна)</label>
        </div>
      </div>
      {score !== null && (
        <div className="rounded bg-primary/10 border border-primary/20 px-4 py-3">
          <div className="text-xs text-muted-foreground mb-1">MELD оноо</div>
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-xs mt-1">{meldInterpretation(score)}</div>
          <Button size="sm" className="mt-3" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-3.5 w-3.5" />Хадгалах
          </Button>
        </div>
      )}
      {meldHistory.length > 0 && <ScoreHistory scores={meldHistory} patientId={patientId} label="MELD" />}
    </div>
  );
}

/* ─── Child-Pugh calculator ──────────────────────────────────────── */

function calcChildPugh(bili: number, albumin: number, inr: number, ascites: number, enceph: number): { score: number; grade: string } {
  let pts = 0;
  pts += bili < 2 ? 1 : bili <= 3 ? 2 : 3;
  pts += albumin > 3.5 ? 1 : albumin >= 2.8 ? 2 : 3;
  pts += inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3;
  pts += ascites;
  pts += enceph;
  const grade = pts <= 6 ? "A" : pts <= 9 ? "B" : "C";
  return { score: pts, grade };
}

function childPughInterpretation(score: number, grade: string): string {
  const survival: Record<string, string> = { A: "1 жилийн амьдрах чадвар ~100%, 2 жилийн ~85%", B: "1 жилийн ~81%, 2 жилийн ~57%", C: "1 жилийн ~45%, 2 жилийн ~35%" };
  return `${score} оноо – Child-Pugh ${grade}. ${survival[grade]}`;
}

function ChildPughCalculator({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [bili, setBili] = useState("");
  const [albumin, setAlbumin] = useState("");
  const [inr, setInr] = useState("");
  const [ascites, setAscites] = useState(0);
  const [enceph, setEnceph] = useState(0);

  const biVal = parseFloat(bili) || 0;
  const alVal = parseFloat(albumin) || 0;
  const inrVal = parseFloat(inr) || 0;
  const canCalc = biVal > 0 && alVal > 0 && inrVal > 0 && ascites > 0 && enceph > 0;
  const result = canCalc ? calcChildPugh(biVal, alVal, inrVal, ascites, enceph) : null;

  const { data: scores } = useQuery({ queryKey: ["clinical-scores", patientId], queryFn: () => getPatientClinicalScores(patientId) });
  const history = scores?.filter((s) => s.type === "child_pugh") ?? [];

  const save = useMutation({
    mutationFn: () => createClinicalScore(patientId, {
      date: today(), type: "child_pugh",
      inputs: { bilirubin: biVal, albumin: alVal, inr: inrVal, ascites, encephalopathy: enceph },
      score: result!.score, grade: result!.grade,
      interpretation: childPughInterpretation(result!.score, result!.grade),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical-scores", patientId] }),
  });

  const RadioRow = ({ label, value, onChange, opts }: { label: string; value: number; onChange: (n: number) => void; opts: [number, string][] }) => (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {opts.map(([v, lbl]) => (
          <label key={v} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors",
            value === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted/50")}>
            <input type="radio" className="sr-only" checked={value === v} onChange={() => onChange(v)} />
            <span className="font-mono text-muted-foreground w-4">{v}п</span>
            {lbl}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <NumField label="Билирубин (мг/дл)" value={bili} onChange={setBili} placeholder="0.0" />
        <NumField label="Альбумин (г/дл)" value={albumin} onChange={setAlbumin} placeholder="3.5" />
        <NumField label="INR" value={inr} onChange={setInr} placeholder="1.0" />
      </div>
      <RadioRow label="Асцит" value={ascites} onChange={setAscites}
        opts={[[1, "Байхгүй"], [2, "Бага (диуретикт хариу үздэг)"], [3, "Хүнд (шингэн авах шаардлагатай)"]]} />
      <RadioRow label="Энцефалопати" value={enceph} onChange={setEnceph}
        opts={[[1, "Байхгүй"], [2, "I–II зэрэг"], [3, "III–IV зэрэг"]]} />
      {result && (
        <div className={cn("rounded border px-4 py-3",
          result.grade === "A" ? "bg-green-50 border-green-200" : result.grade === "B" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200")}>
          <div className="text-xs text-muted-foreground mb-1">Child-Pugh оноо</div>
          <div className="text-2xl font-bold">{result.score} оноо – Ангилал {result.grade}</div>
          <div className="text-xs mt-1">{childPughInterpretation(result.score, result.grade)}</div>
          <Button size="sm" className="mt-3" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-3.5 w-3.5" />Хадгалах
          </Button>
        </div>
      )}
      {history.length > 0 && <ScoreHistory scores={history} patientId={patientId} label="Child-Pugh" />}
    </div>
  );
}

/* ─── QTc Framingham calculator ──────────────────────────────────── */

function calcQtcFramingham(qtMs: number, hrBpm: number): number {
  const rr = 60 / hrBpm;
  return Math.round(qtMs + 154 * (1 - rr));
}

function qtcInterpretation(qtc: number, sex: "male" | "female"): string {
  const limit = sex === "male" ? [440, 470] : [460, 480];
  if (qtc <= limit[0]) return `${qtc} мс – Хэвийн`;
  if (qtc <= limit[1]) return `${qtc} мс – Хил орчмын (borderline)`;
  return `${qtc} мс – Уртассан (prolonged)`;
}

function QTcCalculator({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [qt, setQt] = useState("");
  const [hr, setHr] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");

  const qtVal = parseFloat(qt) || 0;
  const hrVal = parseFloat(hr) || 0;
  const canCalc = qtVal > 0 && hrVal > 0;
  const qtc = canCalc ? calcQtcFramingham(qtVal, hrVal) : null;

  const { data: scores } = useQuery({ queryKey: ["clinical-scores", patientId], queryFn: () => getPatientClinicalScores(patientId) });
  const history = scores?.filter((s) => s.type === "qtc_framingham") ?? [];

  const save = useMutation({
    mutationFn: () => createClinicalScore(patientId, {
      date: today(), type: "qtc_framingham",
      inputs: { qt: qtVal, hr: hrVal, sex },
      score: qtc!, interpretation: qtcInterpretation(qtc!, sex),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical-scores", patientId] }),
  });

  const normal = sex === "male" ? 440 : 460;
  const borderline = sex === "male" ? 470 : 480;
  const color = qtc === null ? "" : qtc <= normal ? "bg-green-50 border-green-200" : qtc <= borderline ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">
        Framingham томъёо: QTc = QT + 0.154 × (1 – RR), RR = 60 / HR
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <NumField label="QT интервал (мс)" value={qt} onChange={setQt} placeholder="400" />
        <NumField label="Зүрхний цохилт (удаа/мин)" value={hr} onChange={setHr} placeholder="72" />
      </div>
      <div className="flex gap-4 text-sm">
        {(["male", "female"] as const).map((s) => (
          <label key={s} className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={sex === s} onChange={() => setSex(s)} className="h-4 w-4" />
            {s === "male" ? "Эрэгтэй (норм ≤440мс)" : "Эмэгтэй (норм ≤460мс)"}
          </label>
        ))}
      </div>
      {qtc !== null && (
        <div className={cn("rounded border px-4 py-3", color)}>
          <div className="text-xs text-muted-foreground mb-1">QTc (Framingham)</div>
          <div className="text-2xl font-bold">{qtc} мс</div>
          <div className="text-xs mt-1">{qtcInterpretation(qtc, sex)}</div>
          <Button size="sm" className="mt-3" onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-3.5 w-3.5" />Хадгалах
          </Button>
        </div>
      )}
      {history.length > 0 && <ScoreHistory scores={history} patientId={patientId} label="QTc" />}
    </div>
  );
}

/* ─── Score history list ─────────────────────────────────────────── */

function ScoreHistory({ scores, patientId, label }: { scores: ClinicalScore[]; patientId: string; label: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const del = useMutation({
    mutationFn: (id: string) => deleteClinicalScore(patientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinical-scores", patientId] }),
  });

  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        Өмнөх {label} оноонуудыг харах ({scores.length})
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {scores.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs rounded bg-muted/40 px-3 py-1.5">
              <span className="text-muted-foreground">{formatDate(s.date)}</span>
              <span className="font-medium">{s.interpretation}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive"
                onClick={() => del.mutate(s.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tab 3: Clinical scores ─────────────────────────────────────── */

function ClinicalScores({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-3">
      <ScoreCard title="MELD Score">
        <MeldCalculator patientId={patientId} />
      </ScoreCard>
      <ScoreCard title="Child-Pugh Score">
        <ChildPughCalculator patientId={patientId} />
      </ScoreCard>
      <ScoreCard title="Corrected QT Interval (QTc) – Framingham">
        <QTcCalculator patientId={patientId} />
      </ScoreCard>
    </div>
  );
}

/* ─── Shared numeric field ───────────────────────────────────────── */

function NumField({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        disabled={disabled} step="0.01"
        className="w-full h-9 rounded border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50" />
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────── */

export function PatientDiagnoses({ patientId }: { patientId: string }) {
  const [tab, setTab] = useState(0);

  return (
    <Card>
      <CardContent className="pt-5">
        <Tabs active={tab} onChange={setTab} />
        {tab === 0 && <DiagnosisList patientId={patientId} />}
        {tab === 1 && <AddDiagnosis patientId={patientId} onSaved={() => setTab(0)} />}
        {tab === 2 && <ClinicalScores patientId={patientId} />}
      </CardContent>
    </Card>
  );
}
