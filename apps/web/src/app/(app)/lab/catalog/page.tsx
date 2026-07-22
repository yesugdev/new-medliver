"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Loader2, Pencil, ToggleLeft, ToggleRight, FlaskConical,
  ChevronUp, ChevronDown,
} from "lucide-react";
import {
  type LabCategory, type LabTest,
} from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { listLabTests, createLabTest, updateLabTest, reorderLabTests } from "@/lib/lab-api";
import { listLabCategories } from "@/lib/lab-categories-api";
import { extractApiError } from "@/lib/api";

/* ─── Blank form ────────────────────────────────────────────────────── */
const EMPTY = {
  code: "", name: "", nameEn: "",
  category: "" as LabCategory,
  testGroup: "",
  unit: "", referenceMin: "", referenceMax: "",
  referenceText: "", turnaroundHours: "",
};

type FormState = typeof EMPTY;

/* ─── Form panel ────────────────────────────────────────────────────── */
function TestForm({
  initial,
  categories,
  onSave,
  onCancel,
  isPending,
}: {
  initial: FormState;
  categories: [LabCategory, string][];
  onSave: (f: FormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [f, setF] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: string) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Code */}
      <div className="space-y-1.5">
        <Label>Код *</Label>
        <Input
          value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())}
          placeholder="GLU" className="font-mono uppercase"
        />
      </div>
      {/* Category */}
      <div className="space-y-1.5">
        <Label>Ангилал *</Label>
        <Select value={f.category} onValueChange={(v) => set("category", v)}>
          <SelectTrigger><SelectValue placeholder="Сонгох..." /></SelectTrigger>
          <SelectContent>
            {categories.map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Name */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Монгол нэр *</Label>
        <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Цусны сахар" />
      </div>
      {/* Test group */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Дэд бүлэг (testGroup)</Label>
        <Input value={f.testGroup} onChange={(e) => set("testGroup", e.target.value)} placeholder="Цусны ерөнхий шинжилгээ (CBC)" />
      </div>
      {/* Name EN */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Англи нэр</Label>
        <Input value={f.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Blood Glucose" />
      </div>
      {/* Unit / ref */}
      <div className="space-y-1.5">
        <Label>Нэгж</Label>
        <Input value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="mmol/L" />
      </div>
      <div className="space-y-1.5">
        <Label>Хариу хугацаа (цаг)</Label>
        <Input
          type="number" min={0}
          value={f.turnaroundHours} onChange={(e) => set("turnaroundHours", e.target.value)}
          placeholder="2"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Лавлах утга доод</Label>
        <Input
          type="number" min={0} step="any"
          value={f.referenceMin} onChange={(e) => set("referenceMin", e.target.value)}
          placeholder="3.9"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Лавлах утга дээд</Label>
        <Input
          type="number" min={0} step="any"
          value={f.referenceMax} onChange={(e) => set("referenceMax", e.target.value)}
          placeholder="6.1"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Чанарын лавлах (жишээ: Сөрөг)</Label>
        <Input
          value={f.referenceText} onChange={(e) => set("referenceText", e.target.value)}
          placeholder="Сөрөг / Negative"
        />
      </div>

      <div className="sm:col-span-2 flex gap-2 pt-2 border-t border-border">
        <Button
          disabled={!f.code || !f.name || !f.category || isPending}
          onClick={() => onSave(f)}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Хадгалах
        </Button>
        <Button variant="ghost" onClick={onCancel}>Болих</Button>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function LabCatalogPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showForm,  setShowForm]  = useState(false);
  const [editTest,  setEditTest]  = useState<LabTest | null>(null);
  const [catFilter, setCatFilter] = useState<string>("");

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["lab-tests-admin"],
    queryFn: () => listLabTests(true),   // include inactive
  });

  const { data: categoryDefs = [] } = useQuery({
    queryKey: ["lab-categories"],
    queryFn: () => listLabCategories(false),
    staleTime: 5 * 60_000,
  });
  const CATEGORIES: [LabCategory, string][] =
    [...categoryDefs].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => [c.key, c.name]);

  const create = useMutation({
    mutationFn: (f: FormState) =>
      createLabTest({
        code:            f.code,
        name:            f.name,
        nameEn:          f.nameEn || undefined,
        category:        f.category,
        testGroup:       f.testGroup || undefined,
        unit:            f.unit || undefined,
        referenceMin:    f.referenceMin ? parseFloat(f.referenceMin) : undefined,
        referenceMax:    f.referenceMax ? parseFloat(f.referenceMax) : undefined,
        referenceText:   f.referenceText || undefined,
        turnaroundHours: f.turnaroundHours ? parseFloat(f.turnaroundHours) : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Шинжилгээ нэмэгдлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-tests-admin"] });
      qc.invalidateQueries({ queryKey: ["lab-tests-all"] });
      setShowForm(false);
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      updateLabTest(id, {
        code:            f.code,
        name:            f.name,
        nameEn:          f.nameEn || undefined,
        category:        f.category,
        testGroup:       f.testGroup || undefined,
        unit:            f.unit || undefined,
        referenceMin:    f.referenceMin ? parseFloat(f.referenceMin) : undefined,
        referenceMax:    f.referenceMax ? parseFloat(f.referenceMax) : undefined,
        referenceText:   f.referenceText || undefined,
        turnaroundHours: f.turnaroundHours ? parseFloat(f.turnaroundHours) : undefined,
      }),
    onSuccess: () => {
      toast({ title: "Шинэчлэгдлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-tests-admin"] });
      qc.invalidateQueries({ queryKey: ["lab-tests-all"] });
      setEditTest(null);
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateLabTest(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests-admin"] }),
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  /* Багана (шинжилгээ)-ны дараалал солих — sortOrder-ыг серверт бичнэ */
  const reorder = useMutation({
    mutationFn: (ids: string[]) => reorderLabTests(ids),
    onError: (e) => {
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" });
      qc.invalidateQueries({ queryKey: ["lab-tests-admin"] });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-tests-all"] }),
  });

  /** Тухайн ангиллын жагсаалт дотор idx-ийг dir(±1) чиглэлд зөөх */
  const moveTest = (items: LabTest[], idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const arr = [...items];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    // Optimistic — sortOrder-ыг шинэ дарааллаар нь шууд шинэчилж хурдан харагдуулна
    const orderMap = new Map(arr.map((t, i) => [t.id, i]));
    qc.setQueryData<LabTest[]>(["lab-tests-admin"], (old) =>
      old ? old.map((t) => (orderMap.has(t.id) ? { ...t, sortOrder: orderMap.get(t.id)! } : t)) : old,
    );
    reorder.mutate(arr.map((t) => t.id));
  };

  const testToForm = (t: LabTest): FormState => ({
    code:            t.code,
    name:            t.name,
    nameEn:          t.nameEn ?? "",
    category:        t.category,
    testGroup:       t.testGroup ?? "",
    unit:            t.unit ?? "",
    referenceMin:    t.referenceMin != null ? String(t.referenceMin) : "",
    referenceMax:    t.referenceMax != null ? String(t.referenceMax) : "",
    referenceText:   t.referenceText ?? "",
    turnaroundHours: t.turnaroundHours != null ? String(t.turnaroundHours) : "",
  });

  const filtered = catFilter
    ? tests.filter((t) => t.category === catFilter)
    : tests;

  const grouped = CATEGORIES.reduce<Record<string, LabTest[]>>((acc, [cat]) => {
    // sortOrder голлон эрэмбэлнэ; sortOrder тэнцүү (жишээ нь бүгд 0) үед
    // testGroup-оор бүлэглэж, дараа нь нэрээр — эхний харагдац цэвэрхэн байна.
    acc[cat] = filtered
      .filter((t) => t.category === cat)
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          (a.testGroup ?? "").localeCompare(b.testGroup ?? "") ||
          a.name.localeCompare(b.name),
      );
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/lab"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-violet-600" />
              Шинжилгээний каталог
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Нийт {tests.length} шинжилгээ · {tests.filter((t) => t.isActive).length} идэвхтэй
            </p>
          </div>
        </div>
        <Button onClick={() => { setShowForm(true); setEditTest(null); }}>
          <Plus className="h-4 w-4" />
          Шинжилгээ нэмэх
        </Button>
      </div>

      {/* ── Add form ─────────────────────────────────────────────────── */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Шинэ шинжилгээ нэмэх</CardTitle>
          </CardHeader>
          <CardContent>
            <TestForm
              initial={EMPTY}
              categories={CATEGORIES}
              onSave={(f) => create.mutate(f)}
              onCancel={() => setShowForm(false)}
              isPending={create.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Category filter ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setCatFilter("")}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            !catFilter ? "bg-primary text-white border-primary" : "border-border hover:bg-muted"
          }`}
        >
          Бүгд ({tests.length})
        </button>
        {CATEGORIES.map(([cat, label]) => {
          const count = tests.filter((t) => t.category === cat).length;
          if (count === 0) return null;
          return (
            <button key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                catFilter === cat ? "bg-primary text-white border-primary" : "border-border hover:bg-muted"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Test list ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(([cat, catLabel]) => {
            const items = grouped[cat] ?? [];
            if (items.length === 0) return null;
            return (
              <Card key={cat} className="overflow-hidden">
                <div className="px-5 py-3 bg-muted/40 border-b border-border">
                  <span className="font-semibold text-sm">{catLabel}</span>
                  <span className="ml-2 text-xs text-muted-foreground">({items.length})</span>
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    · ↑↓ товчоор баганы (шинжилгээний) дарааллыг солино
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {items.map((test, idx) => (
                    <div key={test.id}>
                      {editTest?.id === test.id ? (
                        <div className="p-5">
                          <TestForm
                            initial={testToForm(test)}
                            categories={CATEGORIES}
                            onSave={(f) => update.mutate({ id: test.id, f })}
                            onCancel={() => setEditTest(null)}
                            isPending={update.isPending}
                          />
                        </div>
                      ) : (
                        <div className={`flex items-center gap-3 px-5 py-3 ${!test.isActive ? "opacity-50" : ""}`}>
                          {/* Reorder — зөвхөн ижил бүлэг дотор */}
                          <div className="flex flex-col shrink-0 -my-1">
                            <button
                              type="button"
                              onClick={() => moveTest(items, idx, -1)}
                              disabled={reorder.isPending || idx === 0}
                              title="Дээш"
                              className="h-4 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-25"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTest(items, idx, 1)}
                              disabled={reorder.isPending || idx === items.length - 1}
                              title="Доош"
                              className="h-4 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-25"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="font-mono text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded border border-violet-200 w-20 text-center shrink-0">
                            {test.code}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-medium text-sm">{test.name}</span>
                              {test.nameEn && (
                                <span className="text-xs text-muted-foreground">{test.nameEn}</span>
                              )}
                            </div>
                            {test.testGroup && (
                              <div className="text-[10px] text-violet-600 font-medium">{test.testGroup}</div>
                            )}
                            <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-2 flex-wrap">
                              {test.unit && <span>{test.unit}</span>}
                              {test.referenceMin != null && test.referenceMax != null && (
                                <span>Лавлах: {test.referenceMin}–{test.referenceMax}</span>
                              )}
                              {test.referenceText && <span>Лавлах: {test.referenceText}</span>}
                              {test.turnaroundHours && <span className="text-sky-600">~{test.turnaroundHours}ц</span>}
                            </div>
                          </div>
                          <Badge tone={test.isActive ? "success" : "muted"} className="shrink-0">
                            {test.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                          </Badge>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => setEditTest(test)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              onClick={() => toggleActive.mutate({ id: test.id, isActive: !test.isActive })}
                              disabled={toggleActive.isPending}
                              title={test.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                            >
                              {test.isActive
                                ? <ToggleRight className="h-4 w-4 text-emerald-600" />
                                : <ToggleLeft  className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
