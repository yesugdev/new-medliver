"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Search, FlaskConical } from "lucide-react";
import { type LabCategory } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { listPatients } from "@/lib/patients-api";
import { listLabTests, createLabOrder } from "@/lib/lab-api";
import { listLabCategories } from "@/lib/lab-categories-api";
import { extractApiError } from "@/lib/api";

const PRIORITY_OPTIONS = [
  { value: "routine", label: "Ердийн" },
  { value: "urgent",  label: "Яаралтай" },
  { value: "stat",    label: "Нэн яаралтай" },
];

export default function NewLabOrderPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  /* Patient search */
  const [search,      setSearch]      = useState("");
  const [patientId,   setPatientId]   = useState("");
  const [patientName, setPatientName] = useState("");

  /* Order fields */
  const [priority,     setPriority]     = useState("routine");
  const [clinicalNote, setClinicalNote] = useState("");
  const [labName,      setLabName]      = useState("");
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());

  /* Queries */
  const patients = useQuery({
    queryKey: ["patient-search", search],
    queryFn: () => listPatients({ search: search || undefined, pageSize: 8 }),
    enabled: search.length > 1,
  });

  const { data: tests = [], isLoading: testsLoading } = useQuery({
    queryKey: ["lab-tests-all"],
    queryFn: () => listLabTests(false),
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

  /* Group tests by category */
  const grouped = useMemo(() => {
    const map = new Map<LabCategory, typeof tests>();
    for (const t of tests) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [tests]);

  const toggleTest = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleCategory = (category: LabCategory) => {
    const catTests = grouped.get(category) ?? [];
    const allSelected = catTests.every((t) => selectedIds.has(t.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) catTests.forEach((t) => next.delete(t.id));
      else             catTests.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () =>
      createLabOrder({
        patientId,
        priority: priority as any,
        clinicalNote: clinicalNote || undefined,
        labName: labName.trim() || undefined,
        testIds: [...selectedIds],
      }),
    onSuccess: (order) => {
      toast({ title: "Захиалга үүсгэлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
      router.replace(`/lab/orders/${order.id}`);
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const canSubmit = patientId && selectedIds.size > 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/lab"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-violet-600" />
          Шинжилгээ захиалах
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: patient + meta ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Өвчтөн *</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {patientId ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-md border bg-muted/30 text-sm">
                    {patientName}
                  </div>
                  <Button variant="ghost" size="sm"
                    onClick={() => { setPatientId(""); setPatientName(""); setSearch(""); }}>
                    Солих
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
                    <div className="border rounded-md divide-y max-h-52 overflow-y-auto">
                      {patients.data.items.map((p) => (
                        <button key={p.id} type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            setPatientId(p.id);
                            setPatientName(`${p.lastName} ${p.firstName} · ${p.patientCode}`);
                          }}>
                          <div className="font-medium">{p.lastName} {p.firstName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {p.patientCode} · {p.phone}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Захиалгын тохиргоо</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Яаралтай байдал</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Шинжилгээ хийх эмнэлэг</Label>
                <Input
                  placeholder="Жш: Улсын төв лаборатори"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Клиникийн тэмдэглэл</Label>
                <Textarea
                  rows={3}
                  placeholder="Өвчтөний байдал, шинжилгээний зорилго..."
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-violet-50 border-violet-200">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-violet-800 mb-2">
                Сонгосон шинжилгээ: {selectedIds.size}
              </div>
              {selectedIds.size > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tests
                    .filter((t) => selectedIds.has(t.id))
                    .map((t) => (
                      <span key={t.id}
                        className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
                        {t.code}
                      </span>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Хадгалж байна...</>
              : "Захиалга үүсгэх"}
          </Button>
        </div>

        {/* ── Right: test checklist ─────────────────────────────────── */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Шинжилгээний жагсаалт
                {testsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tests.length === 0 && !testsLoading ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Шинжилгээний каталог хоосон байна.{" "}
                  <Link href="/lab/catalog" className="text-primary underline">
                    Каталог нэмэх
                  </Link>
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {([...grouped.entries()] as [LabCategory, typeof tests][]).map(([cat, catTests]) => {
                    const allSel = catTests.every((t) => selectedIds.has(t.id));
                    const someSel = catTests.some((t) => selectedIds.has(t.id));
                    return (
                      <div key={cat}>
                        {/* Category header */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted text-sm font-semibold text-left"
                        >
                          <span>{categoryLabel.get(cat) ?? cat}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            allSel ? "bg-violet-100 text-violet-700 border-violet-300"
                              : someSel ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "text-muted-foreground border-border"
                          }`}>
                            {catTests.filter((t) => selectedIds.has(t.id)).length}/{catTests.length}
                          </span>
                        </button>

                        {/* Test rows */}
                        {/* Group by testGroup within category */}
                        {(() => {
                          const groups = new Map<string, typeof catTests>();
                          for (const t of catTests) {
                            const g = t.testGroup ?? "";
                            const arr = groups.get(g) ?? [];
                            arr.push(t);
                            groups.set(g, arr);
                          }
                          return [...groups.entries()].map(([grp, grpTests]) => (
                            <div key={grp}>
                              {grp && (
                                <div className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/20 border-b border-border">
                                  {grp}
                                </div>
                              )}
                              {grpTests.map((test) => {
                                const checked = selectedIds.has(test.id);
                                return (
                                  <label key={test.id}
                                    className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                                      checked ? "bg-violet-50/60" : ""
                                    }`}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleTest(test.id)}
                                      className="mt-0.5 accent-violet-600"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline gap-2">
                                        <span className={`text-sm ${checked ? "font-medium" : ""}`}>
                                          {test.name}
                                        </span>
                                        <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                                          {test.code}
                                        </span>
                                      </div>
                                      {(test.unit || test.referenceMin != null || test.referenceText) && (
                                        <div className="text-[11px] text-muted-foreground mt-0.5">
                                          {test.unit && <span>{test.unit}</span>}
                                          {test.referenceMin != null && test.referenceMax != null && (
                                            <span className="ml-2">
                                              {test.referenceMin}–{test.referenceMax}
                                            </span>
                                          )}
                                          {test.referenceText && (
                                            <span className="ml-2">{test.referenceText}</span>
                                          )}
                                          {test.turnaroundHours && (
                                            <span className="ml-2 text-sky-600">
                                              ~{test.turnaroundHours}ц
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          ));
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
