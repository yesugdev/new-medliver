"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Inbox, X, Check, Pencil } from "lucide-react";
import {
  type LabCategory,
  type LabInterpretation,
  type LabOrder,
  type LabTest,
} from "@his/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { listLabOrders, listLabTests, quickLabResult } from "@/lib/lab-api";
import { listLabCategories } from "@/lib/lab-categories-api";
import { extractApiError } from "@/lib/api";

/* Утгын өнгө — interpretation-аар */
function valueClass(interp?: LabInterpretation): string {
  if (interp === "high" || interp === "critical_high") return "text-rose-600 font-semibold";
  if (interp === "low" || interp === "critical_low") return "text-amber-600 font-semibold";
  if (interp === "abnormal") return "text-rose-600";
  return "";
}

/* Лавлагаа муж + нэгжтэй баганын гарчиг */
function colHeader(name: string, refMin?: number, refMax?: number, refText?: string, unit?: string): string {
  let ref = "";
  if (refMin != null && refMax != null) ref = ` (${refMin} - ${refMax})`;
  else if (refText) ref = ` (${refText})`;
  return `${name}${ref}${unit ? ` ${unit}` : ""}`;
}

interface ResultRec {
  category: LabCategory;
  group: string;
  orderId: string;
  /** ISO timestamp — мөр эрэмбэлэх ба харуулах */
  recordedAt: string;
  testId: string;
  testName: string;
  unit?: string;
  refMin?: number;
  refMax?: number;
  refText?: string;
  sortOrder: number;
  date: string;       // YYYY-MM-DD
  value: string;
  interp?: LabInterpretation;
  notes?: string;
  resultedByName?: string;
  labName?: string;
}

/* ─── Нэг бүлгийн матриц хүснэгт ─────────────────────────────────────── */
function GroupTable({ group, recs }: { group: string; recs: ResultRec[] }) {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  // Баганууд = ялгаатай тест (sortOrder-аар)
  const tests = useMemo(() => {
    const map = new Map<string, ResultRec>();
    for (const r of recs) if (!map.has(r.testId)) map.set(r.testId, r);
    return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.testName.localeCompare(b.testName));
  }, [recs]);

  // Мөрүүд = захиалга тус бүр (огноо+цагаар өсөхөөр). Нэг өдөр олон захиалга = тусдаа мөр.
  const rows = useMemo(() => {
    const m = new Map<string, { orderId: string; ts: string }>();
    for (const r of recs) if (!m.has(r.orderId)) m.set(r.orderId, { orderId: r.orderId, ts: r.recordedAt });
    return [...m.values()].sort((a, b) => b.ts.localeCompare(a.ts));
  }, [recs]);

  // (orderId, testId) → утга
  const cell = useMemo(() => {
    const m = new Map<string, ResultRec>();
    for (const r of recs) m.set(`${r.orderId}__${r.testId}`, r);
    return m;
  }, [recs]);

  const metaByOrder = (orderId: string) => {
    const rowRecs = recs.filter((r) => r.orderId === orderId);
    const notes = rowRecs.map((r) => r.notes).filter(Boolean).join("; ");
    const recordedBy = rowRecs.find((r) => r.resultedByName)?.resultedByName ?? "";
    const lab = rowRecs.find((r) => r.labName)?.labName ?? "";
    return { notes, recordedBy, lab };
  };

  const dt = (iso: string) => {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold">{group}</h4>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-emerald-900 text-white">
              <th className="text-left px-3 py-1.5 font-medium sticky left-0 bg-emerald-900 z-10">Огноо</th>
              {tests.map((t) => (
                <th key={t.testId} className="text-left px-3 py-1.5 font-medium">
                  {colHeader(t.testName, t.refMin, t.refMax, t.refText, t.unit)}
                </th>
              ))}
              <th className="text-left px-3 py-1.5 font-medium">Тэмдэглэл</th>
              <th className="text-left px-3 py-1.5 font-medium">Эмнэлэг</th>
              <th className="text-left px-3 py-1.5 font-medium">Бүртгэсэн</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const meta = metaByOrder(row.orderId);
              return (
                <tr key={row.orderId} className={i % 2 ? "bg-muted/30" : "bg-white"}>
                  <td className="px-3 py-1.5 font-mono sticky left-0 z-10 bg-inherit">
                    <div className="flex items-center gap-1.5">
                      <span>{dt(row.ts)}</span>
                      {isAdmin && (
                        <Link
                          href={`/lab/orders/${row.orderId}?from=patient`}
                          title="Хариу засах / устгах"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </td>
                  {tests.map((t) => {
                    const r = cell.get(`${row.orderId}__${t.testId}`);
                    return (
                      <td key={t.testId} className={`px-3 py-1.5 tabular-nums ${valueClass(r?.interp)}`}>
                        {r?.value ?? ""}
                      </td>
                    );
                  })}
                  <td className="px-3 py-1.5 text-muted-foreground">{meta.notes || ""}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{meta.lab || ""}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{meta.recordedBy || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Хариу оруулах panel (захиалга үүсгэлгүйгээр) ──────────────────── */
function ResultEntryPanel({
  patientId,
  category,
  categoryLabel,
  tests,
  onClose,
}: {
  patientId: string;
  category: LabCategory;
  categoryLabel: string;
  tests: LabTest[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [date, setDate]       = useState(() => new Date().toISOString().slice(0, 10));
  const [labName, setLabName] = useState("");
  const [values, setValues]   = useState<Record<string, string>>({});

  const groups = useMemo(() => {
    const order: string[] = [];
    const byGroup = new Map<string, LabTest[]>();
    for (const t of [...tests].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) {
      const g = t.testGroup?.trim() || "Бусад";
      if (!byGroup.has(g)) { byGroup.set(g, []); order.push(g); }
      byGroup.get(g)!.push(t);
    }
    return order.map((g) => ({ group: g, tests: byGroup.get(g)! }));
  }, [tests]);

  const save = useMutation({
    mutationFn: () => {
      const items = Object.entries(values)
        .filter(([, v]) => v.trim() !== "")
        .map(([testId, value]) => ({ testId, value: value.trim() }));
      if (items.length === 0) throw new Error("Хариу оруулаагүй байна");
      // Сонгосон огноог одоогийн цагтай хослуулна (UTC шөнө дунд болж 08:00 харагдахаас сэргийлнэ)
      const [yy, mm, dd] = date.split("-").map(Number);
      const now = new Date();
      const stamp = new Date(yy, mm - 1, dd, now.getHours(), now.getMinutes(), now.getSeconds());
      return quickLabResult({
        patientId,
        date: stamp.toISOString(),
        labName: labName.trim() || undefined,
        items,
      });
    },
    onSuccess: () => {
      toast({ title: "Хариу хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-orders-by-patient", patientId] });
      onClose();
    },
    onError: (e) => toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const filled = Object.values(values).filter((v) => v.trim() !== "").length;
  const ref = (t: LabTest) =>
    t.referenceMin != null && t.referenceMax != null
      ? `${t.referenceMin} - ${t.referenceMax}`
      : t.referenceText ?? "";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-emerald-600" />
            {categoryLabel} — хариу оруулах
          </h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Огноо + эмнэлэг */}
        <div className="grid grid-cols-2 gap-3 px-5 py-3 border-b border-border">
          <div className="space-y-1">
            <Label className="text-xs">Шинжилгээ хийсэн огноо</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Эмнэлэг / лаборатори</Label>
            <Input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="Жш: Төв лаборатори" className="h-8 text-sm" />
          </div>
        </div>

        {/* Тестүүд */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {groups.map(({ group, tests: gts }) => (
            <div key={group} className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">{group}</h4>
              <div className="space-y-1.5">
                {gts.map((t) => (
                  <div key={t.id} className="grid grid-cols-[1fr_120px] items-center gap-2">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{t.name}</div>
                      {(ref(t) || t.unit) && (
                        <div className="text-[11px] text-muted-foreground">
                          {ref(t)}{t.unit ? ` ${t.unit}` : ""}
                        </div>
                      )}
                    </div>
                    {t.inputType === "select" && t.options?.length ? (
                      <select
                        value={values[t.id] ?? ""}
                        onChange={(e) => setValues((p) => ({ ...p, [t.id]: e.target.value }))}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">—</option>
                        {t.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <Input
                        value={values[t.id] ?? ""}
                        onChange={(e) => setValues((p) => ({ ...p, [t.id]: e.target.value }))}
                        placeholder="Утга"
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-border">
          <Button className="w-full" disabled={filled === 0 || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Хадгалах {filled > 0 ? `(${filled})` : ""}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─── Үндсэн модул ───────────────────────────────────────────────────── */
export function PatientLabResults({ patientId }: { patientId: string }) {
  const { data: ordersResp, isLoading: ordersLoading } = useQuery({
    queryKey: ["lab-orders-by-patient", patientId],
    queryFn: () => listLabOrders({ patientId, pageSize: 200 }),
  });
  const { data: catalog = [], isLoading: catLoading } = useQuery({
    queryKey: ["lab-tests-all"],
    queryFn: () => listLabTests(true),
    staleTime: 5 * 60_000,
  });
  const { data: categoryDefs = [] } = useQuery({
    queryKey: ["lab-categories"],
    queryFn: () => listLabCategories(false),
    staleTime: 5 * 60_000,
  });
  const categoryLabel = useMemo(
    () => new Map(categoryDefs.map((c) => [c.key, c.name])),
    [categoryDefs],
  );
  const categoryOrder = useMemo(
    () => [...categoryDefs].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => c.key),
    [categoryDefs],
  );

  // testId → catalog (category, sortOrder)
  const catById = useMemo(() => {
    const m = new Map<string, { category: LabCategory; sortOrder: number }>();
    for (const t of catalog) m.set(t.id, { category: t.category, sortOrder: t.sortOrder ?? 0 });
    return m;
  }, [catalog]);

  // Хариутай item-уудыг records болгож задлах
  const records = useMemo<ResultRec[]>(() => {
    const orders: LabOrder[] = ordersResp?.items ?? [];
    const out: ResultRec[] = [];
    for (const o of orders) {
      for (const it of o.items) {
        if (it.value == null || String(it.value).trim() === "") continue;
        const meta = catById.get(it.testId);
        out.push({
          category:       meta?.category ?? "other",
          group:          it.testGroup?.trim() || "Бусад",
          orderId:        o.id,
          recordedAt:     it.resultedAt ?? o.orderedAt,
          testId:         it.testId,
          testName:       it.testName,
          unit:           it.unit,
          refMin:         it.referenceMin,
          refMax:         it.referenceMax,
          refText:        it.referenceText,
          sortOrder:      meta?.sortOrder ?? 0,
          date:           (it.resultedAt ?? o.orderedAt).slice(0, 10),
          value:          String(it.value),
          interp:         it.interpretation,
          notes:          it.notes,
          resultedByName: it.resultedByName,
          labName:        o.labName,
        });
      }
    }
    return out;
  }, [ordersResp, catById]);

  // Бүх категори (catalog дахь) — tab бүр харагдана, хариугүй ч хоосон харагдана
  const categories = useMemo(() => {
    const present = new Set(catalog.map((t) => t.category));
    return categoryOrder.filter((c) => present.has(c));
  }, [catalog, categoryOrder]);

  const [active, setActive] = useState<LabCategory | null>(null);
  const activeCat = active && categories.includes(active) ? active : categories[0] ?? null;

  const user = useAuthStore((s) => s.user);
  const canRecord = !!user && ["admin", "doctor", "nurse"].includes(user.role);
  const [entryOpen, setEntryOpen] = useState(false);
  const activeTests = useMemo(
    () => (activeCat ? catalog.filter((t) => t.category === activeCat) : []),
    [catalog, activeCat],
  );

  // Идэвхтэй категорийн бүлгүүд
  const groups = useMemo(() => {
    if (!activeCat) return [];
    const inCat = records.filter((r) => r.category === activeCat);
    const order: string[] = [];
    for (const r of inCat) if (!order.includes(r.group)) order.push(r.group);
    return order.map((g) => ({ group: g, recs: inCat.filter((r) => r.group === g) }));
  }, [records, activeCat]);

  const isLoading = ordersLoading || catLoading;

  return (
    <Card>
      {entryOpen && activeCat && (
        <ResultEntryPanel
          patientId={patientId}
          category={activeCat}
          categoryLabel={categoryLabel.get(activeCat) ?? activeCat}
          tests={activeTests}
          onClose={() => setEntryOpen(false)}
        />
      )}
      <CardContent className="p-0">
        {/* Толгой + ХАРИУ ОРУУЛАХ */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-base font-semibold flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-emerald-600" />
            Шинжилгээ
          </span>
          {canRecord && (
            <Button
              size="sm"
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={!activeCat || activeTests.length === 0}
              onClick={() => setEntryOpen(true)}
            >
              ХАРИУ ОРУУЛАХ
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <Inbox className="h-10 w-10 opacity-20" />
            <p className="text-sm">Мэдээлэл байхгүй байна</p>
          </div>
        ) : (
          <>
            {/* Категори tab-ууд — бүх шинжилгээ */}
            <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActive(c)}
                  className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors ${
                    activeCat === c
                      ? "bg-emerald-700 text-white font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {categoryLabel.get(c) ?? c}
                </button>
              ))}
            </div>

            {/* Бүлгийн хүснэгтүүд — хариугүй бол хоосон */}
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Inbox className="h-9 w-9 opacity-20" />
                <p className="text-xs">Мэдээлэл байхгүй байна</p>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                {groups.map(({ group, recs }) => (
                  <GroupTable key={group} group={group} recs={recs} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
