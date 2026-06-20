"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Pill, Plus, Pencil, Trash2, Loader2, AlertTriangle, X, Check,
  Boxes, CalendarX2, BarChart3, ChevronRight, SlidersHorizontal, Download,
} from "lucide-react";
import type { Drug, CreateDrugInput } from "@his/shared";
import { DRUG_CATEGORIES } from "@his/shared";
import { getDrugOptions } from "@/lib/drug-options-api";
import { downloadDrugExcel } from "@/lib/drug-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { listDrugs, createDrug, updateDrug, deleteDrug, listExpiring, getDrugExport } from "@/lib/drugs-api";
import { extractApiError } from "@/lib/api";

const fmt = (n: number) => n.toLocaleString("mn-MN");

/* ─── Edit/Add slide panel ───────────────────────────────────────── */
function DrugPanel({ drug, onClose }: { drug: Drug | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [code,         setCode]         = useState(drug?.code ?? "");
  const [name,         setName]         = useState(drug?.name ?? "");
  const [form,         setForm]         = useState(drug?.form ?? "");
  const [dosage,       setDosage]       = useState(drug?.dosage ?? "");
  const [unit,         setUnit]         = useState(drug?.unit ?? "");
  const [category,     setCategory]     = useState(drug?.category ?? "");
  const [manufacturer, setManufacturer] = useState(drug?.manufacturer ?? "");
  const [minStock,     setMinStock]     = useState(String(drug?.minStock ?? 0));
  const [description,  setDescription]  = useState(drug?.description ?? "");
  const [isActive,     setIsActive]     = useState(drug?.isActive ?? true);

  const isEdit = !!drug;

  const { data: drugOptions = [] } = useQuery({
    queryKey: ["drug-options"],
    queryFn: getDrugOptions,
    staleTime: 5 * 60_000,
  });
  const manufacturerOptions = drugOptions.filter((o) => o.type === "manufacturer").map((o) => o.name);
  const categoryNames       = drugOptions.filter((o) => o.type === "category").map((o) => o.name);
  const categoryOptions     = categoryNames.length > 0 ? categoryNames : [...DRUG_CATEGORIES];

  const saveMut = useMutation({
    mutationFn: () => {
      const base = {
        code: code || undefined,
        name, form, dosage, unit,
        category:     category || undefined,
        manufacturer: manufacturer || undefined,
        minStock:     Number(minStock),
        description:  description || undefined,
      };
      return isEdit
        ? updateDrug(drug.id, { ...base, isActive })
        : createDrug(base as CreateDrugInput);
    },
    onSuccess: () => {
      toast({ title: isEdit ? "Шинэчиллээ" : "Эм бүртгэгдлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["drugs"] });
      onClose();
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const isValid = name && form && dosage && unit;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">{isEdit ? "Эм засах" : "Шинэ эм бүртгэх"}</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label>Эмийн код</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PCT500" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Эмийн нэр <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="жш: Амоксициллин" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Хэлбэр <span className="text-destructive">*</span></Label>
              <Input value={form} onChange={(e) => setForm(e.target.value)} placeholder="Шахмал, Тариа..." />
            </div>
            <div className="space-y-1.5">
              <Label>Тун <span className="text-destructive">*</span></Label>
              <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="500мг..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Нэгж <span className="text-destructive">*</span></Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ширхэг, ампул..." />
            </div>
            <div className="space-y-1.5">
              <Label>Ангилал</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Сонгох —</option>
                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Үйлдвэрлэгч <span className="text-xs text-muted-foreground">(сонгох эсвэл бичих)</span></Label>
            <Input
              list="drug-manufacturers"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="Үйлдвэрлэгч компани..."
            />
            <datalist id="drug-manufacturers">
              {manufacturerOptions.map((m) => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label>Анхааруулга өгөх доод хэмжээ</Label>
            <Input type="number" min={0} value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
            Зарах үнэ болон нөөцийг <span className="font-medium text-foreground">цувралын орлогоор</span> нэмнэ — эмийг хадгалсны дараа дэлгэрэнгүй хуудаснаас «Орлого нэмэх».
          </div>

          <div className="space-y-1.5">
            <Label>Тайлбар</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Нэмэлт мэдээлэл..." />
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="text-sm font-medium">Идэвхтэй эсэх</div>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          )}

          <Button className="w-full" disabled={!isValid || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEdit ? "Хадгалах" : "Бүртгэх"}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function DrugsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [panel, setPanel]       = useState<"create" | Drug | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await getDrugExport();
      downloadDrugExcel(data);
    } catch (err) {
      toast({ title: "Excel татахад алдаа гарлаа", description: extractApiError(err), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const { data: drugs = [], isLoading } = useQuery({
    queryKey: ["drugs"],
    queryFn:  () => listDrugs(false),
  });

  const { data: expiring = [] } = useQuery({
    queryKey: ["drugs-expiring"],
    queryFn:  () => listExpiring(30),
  });

  const { data: drugOptions = [] } = useQuery({
    queryKey: ["drug-options"],
    queryFn:  getDrugOptions,
    staleTime: 5 * 60_000,
  });
  const catNames = drugOptions.filter((o) => o.type === "category").map((o) => o.name);
  const filterCategories = catNames.length > 0 ? catNames : [...DRUG_CATEGORIES];

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDrug(id),
    onSuccess: () => {
      toast({ title: "Устгагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["drugs"] });
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const filtered = drugs.filter((d) => {
    if (catFilter && d.category !== catFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.form.toLowerCase().includes(q) ||
      d.dosage.toLowerCase().includes(q) ||
      (d.manufacturer ?? "").toLowerCase().includes(q)
    );
  });

  const lowStock = drugs.filter((d) => d.isActive && d.stock <= d.minStock && d.minStock > 0);
  const now = Date.now();
  const expired = expiring.filter((b) => new Date(b.expiryDate).getTime() <= now);
  const soon    = expiring.filter((b) => new Date(b.expiryDate).getTime() > now);

  return (
    <div className="space-y-6 max-w-6xl">
      {panel === "create" && <DrugPanel drug={null} onClose={() => setPanel(null)} />}
      {panel && panel !== "create" && <DrugPanel drug={panel as Drug} onClose={() => setPanel(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Эм бүртгэл
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Эмийн нөөц, цуврал, үнэ удирдах</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Excel татах
          </Button>
          <Link href="/settings/drug-options">
            <Button variant="outline"><SlidersHorizontal className="h-4 w-4" />Сонголт</Button>
          </Link>
          <Link href="/drugs/reports">
            <Button variant="outline"><BarChart3 className="h-4 w-4" />Тайлан</Button>
          </Link>
          <Button onClick={() => setPanel("create")}>
            <Plus className="h-4 w-4" />Шинэ эм
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {expired.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <CalendarX2 className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800">
            <span className="font-semibold">{expired.length} цувралын хугацаа дууссан байна.</span>{" "}
            Тайлангаас дэлгэрэнгүйг шалгана уу.
          </div>
        </div>
      )}
      {soon.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">{soon.length} цувралын хугацаа 30 хоногт дуусна.</span>
          </div>
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">{lowStock.length} эмийн нөөц доод хэмжээнд хүрсэн:</span>{" "}
            {lowStock.map((d) => `${d.name} (${d.stock} ${d.unit})`).join(", ")}
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 flex-wrap">
          <CardTitle>Бүх эм ({drugs.length})</CardTitle>
          <div className="flex gap-2">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Бүх ангилал</option>
              {filterCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input placeholder="Хайх..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {search || catFilter ? "Хайлтад тохирох эм олдсонгүй" : "Эм бүртгэгдээгүй байна"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Код</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Эмийн нэр</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Ангилал</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Тун</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Үнэ</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Нөөц</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Төлөв</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => {
                    const isLow = d.isActive && d.minStock > 0 && d.stock <= d.minStock;
                    const isEmpty = d.stock <= 0;
                    return (
                      <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.code || "—"}</td>
                        <td className="px-4 py-3">
                          <Link href={`/drugs/${d.id}`} className="font-medium text-primary hover:underline">
                            {d.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">{d.form}{d.manufacturer ? ` · ${d.manufacturer}` : ""}</div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{d.category || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs">{d.dosage}</td>
                        <td className="px-4 py-3 text-right">{d.salePrice > 0 ? `${fmt(d.salePrice)}₮` : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${isEmpty ? "text-rose-600" : isLow ? "text-amber-600" : "text-foreground"}`}>
                            {d.stock}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">{d.unit}</span>
                          {isLow && !isEmpty && <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />}
                        </td>
                        <td className="px-4 py-3">
                          {d.isActive ? <Badge tone="success">Идэвхтэй</Badge> : <Badge tone="muted">Идэвхгүй</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/drugs/${d.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                <Boxes className="h-3.5 w-3.5" />Нөөц
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPanel(d)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm(`"${d.name}" эмийг устгах уу?`)) deleteMut.mutate(d.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
