"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pill, Plus, Pencil, Trash2, Loader2, AlertTriangle, X, Check, PackagePlus } from "lucide-react";
import type { Drug, CreateDrugInput, UpdateDrugInput } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { listDrugs, createDrug, updateDrug, deleteDrug, adjustStock } from "@/lib/drugs-api";
import { extractApiError } from "@/lib/api";

/* ─── Edit/Add slide panel ───────────────────────────────────────── */
function DrugPanel({
  drug,
  onClose,
}: {
  drug: Drug | null; // null = create mode
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [name,        setName]        = useState(drug?.name ?? "");
  const [form,        setForm]        = useState(drug?.form ?? "");
  const [dosage,      setDosage]      = useState(drug?.dosage ?? "");
  const [unit,        setUnit]        = useState(drug?.unit ?? "");
  const [stock,       setStock]       = useState(String(drug?.stock ?? 0));
  const [minStock,    setMinStock]    = useState(String(drug?.minStock ?? 0));
  const [description, setDescription] = useState(drug?.description ?? "");
  const [isActive,    setIsActive]    = useState(drug?.isActive ?? true);

  const isEdit = !!drug;

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        name, form, dosage, unit,
        stock:    Number(stock),
        minStock: Number(minStock),
        description: description || undefined,
      };
      return isEdit
        ? updateDrug(drug.id, { ...payload, isActive })
        : createDrug(payload as CreateDrugInput);
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
            <h2 className="text-base font-semibold">
              {isEdit ? "Эм засах" : "Шинэ эм бүртгэх"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Эмийн нэр <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="жш: Амоксициллин" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Хэлбэр <span className="text-destructive">*</span></Label>
              <Input value={form} onChange={(e) => setForm(e.target.value)} placeholder="Хавтас, Шахмал..." />
            </div>
            <div className="space-y-1.5">
              <Label>Тун <span className="text-destructive">*</span></Label>
              <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="500мг, 250мг/5мл..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Нэгж <span className="text-destructive">*</span></Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ширхэг, ампул, сав..." />
            </div>
            <div className="space-y-1.5">
              <Label>Одоогийн нөөц</Label>
              <Input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Доод хэмжээ <span className="text-xs text-muted-foreground">(анхааруулга)</span></Label>
            <Input type="number" min={0} value={minStock} onChange={(e) => setMinStock(e.target.value)} />
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!isValid || saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEdit ? "Хадгалах" : "Бүртгэх"}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─── Stock adjust panel ─────────────────────────────────────────── */
function StockPanel({ drug, onClose }: { drug: Drug; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [delta, setDelta] = useState("");
  const [mode,  setMode]  = useState<"add" | "remove">("add");

  const mut = useMutation({
    mutationFn: () => {
      const d = Number(delta);
      return adjustStock(drug.id, mode === "add" ? d : -d);
    },
    onSuccess: () => {
      toast({ title: "Нөөц шинэчиллээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["drugs"] });
      onClose();
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Нөөц тохируулах</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg border border-border px-4 py-3 bg-muted/20">
            <div className="text-xs text-muted-foreground">Одоогийн нөөц</div>
            <div className="text-2xl font-bold mt-1">
              {drug.stock} <span className="text-sm font-normal text-muted-foreground">{drug.unit}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode("add")}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                mode === "add" ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >+ Нэмэх</button>
            <button
              onClick={() => setMode("remove")}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                mode === "remove" ? "bg-rose-600 text-white border-rose-600" : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >− Хасах</button>
          </div>

          <div className="space-y-1.5">
            <Label>Тоо хэмжээ ({drug.unit})</Label>
            <Input
              type="number"
              min={1}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="0"
            />
          </div>

          <Button
            className="w-full"
            disabled={!delta || Number(delta) <= 0 || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "add" ? "Нэмэх" : "Хасах"}
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
  const [search, setSearch] = useState("");
  const [panel, setPanel]   = useState<"create" | Drug | null>(null);
  const [stockDrug, setStockDrug] = useState<Drug | null>(null);

  const { data: drugs = [], isLoading } = useQuery({
    queryKey: ["drugs"],
    queryFn:  () => listDrugs(false),
  });

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
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.form.toLowerCase().includes(q) ||
      d.dosage.toLowerCase().includes(q)
    );
  });

  const lowStock = drugs.filter((d) => d.isActive && d.stock <= d.minStock && d.minStock > 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Panels */}
      {panel === "create" && (
        <DrugPanel drug={null} onClose={() => setPanel(null)} />
      )}
      {panel && panel !== "create" && (
        <DrugPanel drug={panel as Drug} onClose={() => setPanel(null)} />
      )}
      {stockDrug && (
        <StockPanel drug={stockDrug} onClose={() => setStockDrug(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Эм бүртгэл
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Эмийн нөөц болон жагсаалт удирдах</p>
        </div>
        <Button onClick={() => setPanel("create")}>
          <Plus className="h-4 w-4" />
          Шинэ эм
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">{lowStock.length} эмийн нөөц дууссан эсвэл доод хэмжээнд хүрсэн байна:</span>
            {" "}
            {lowStock.map((d) => `${d.name} (${d.stock} ${d.unit})`).join(", ")}
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Бүх эм ({drugs.length})</CardTitle>
          <Input
            placeholder="Хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-60"
          />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {search ? "Хайлтад тохирох эм олдсонгүй" : "Эм бүртгэгдээгүй байна"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Эмийн нэр</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Хэлбэр</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Тун</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Нэгж</th>
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
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.form}</td>
                        <td className="px-4 py-3 font-mono text-xs">{d.dosage}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{d.unit}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${isEmpty ? "text-rose-600" : isLow ? "text-amber-600" : "text-foreground"}`}>
                            {d.stock}
                          </span>
                          {isLow && !isEmpty && (
                            <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {d.isActive ? (
                            <Badge tone="success">Идэвхтэй</Badge>
                          ) : (
                            <Badge tone="muted">Идэвхгүй</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => setStockDrug(d)}
                            >
                              <PackagePlus className="h-3.5 w-3.5" />
                              Нөөц
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setPanel(d)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (confirm(`"${d.name}" эмийг устгах уу?`)) {
                                  deleteMut.mutate(d.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
