"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Boxes, Plus, Loader2, X, Check, ArrowDownUp,
  CalendarX2, AlertTriangle, PackagePlus, PackageMinus, Settings2,
} from "lucide-react";
import type { CreateBatchInput, StockMovementType } from "@his/shared";
import { STOCK_MOVEMENT_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { getDrug, listBatches, addBatch, listMovements } from "@/lib/drugs-api";
import { extractApiError } from "@/lib/api";
import { formatDateTimeMn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("mn-MN");
const dateStr = (iso: string) => new Date(iso).toLocaleDateString("mn-MN");

/** Auto ID — жш: PCT240501 (код + yymmdd) */
function genBatchNo(code?: string): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${(code || "LOT").toUpperCase()}${yy}${mm}${dd}`;
}
const today = () => new Date().toISOString().slice(0, 10);

/* ─── Add batch panel ─────────────────────────────────────────────── */
function BatchPanel({ drugId, drugCode, onClose }: { drugId: string; drugCode?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [batchNumber] = useState(() => genBatchNo(drugCode));
  const [expiryDate,  setExpiryDate]  = useState("");
  const [quantity,    setQuantity]    = useState("");
  const [costPrice,   setCostPrice]   = useState("");
  const [salePrice,   setSalePrice]   = useState("");
  const [supplier,    setSupplier]    = useState("");
  const [receivedAt,  setReceivedAt]  = useState(today);

  const mut = useMutation({
    mutationFn: () => addBatch(drugId, {
      batchNumber,
      expiryDate: new Date(expiryDate).toISOString(),
      quantity: Number(quantity),
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      supplier: supplier || undefined,
      receivedAt: receivedAt ? new Date(receivedAt).toISOString() : undefined,
    } as CreateBatchInput),
    onSuccess: () => {
      toast({ title: "Орлого бүртгэгдлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["drug", drugId] });
      qc.invalidateQueries({ queryKey: ["drug-batches", drugId] });
      qc.invalidateQueries({ queryKey: ["drug-movements", drugId] });
      qc.invalidateQueries({ queryKey: ["drugs"] });
      onClose();
    },
    onError: (err) => toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const valid = batchNumber && expiryDate && Number(quantity) > 0 && salePrice !== "";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Орлого — шинэ цуврал</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Цувралын дугаар <span className="text-xs text-muted-foreground">(Auto ID)</span></Label>
            <Input value={batchNumber} readOnly disabled className="font-mono bg-muted/40" />
          </div>
          <div className="space-y-1.5">
            <Label>Дуусах хугацаа <span className="text-destructive">*</span></Label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Тоо хэмжээ <span className="text-destructive">*</span></Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Худалдан авсан үнэ (₮)</Label>
              <Input type="number" min={0} value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Зарах нэгж үнэ (₮) <span className="text-destructive">*</span></Label>
            <Input type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Нийлүүлэгч</Label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Нийлүүлэгч компани..." />
          </div>
          <div className="space-y-1.5">
            <Label>Орлогын огноо</Label>
            <Input type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!valid || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Орлого бүртгэх
          </Button>
        </div>
      </div>
    </>
  );
}

const MOVE_ICON: Record<StockMovementType, React.ReactNode> = {
  in:     <PackagePlus className="h-3.5 w-3.5 text-emerald-600" />,
  out:    <PackageMinus className="h-3.5 w-3.5 text-rose-600" />,
  adjust: <Settings2 className="h-3.5 w-3.5 text-blue-600" />,
  expire: <CalendarX2 className="h-3.5 w-3.5 text-amber-600" />,
};

/* ─── Page ────────────────────────────────────────────────────────── */
export default function DrugDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [showBatch, setShowBatch] = useState(false);

  const { data: drug, isLoading } = useQuery({ queryKey: ["drug", id], queryFn: () => getDrug(id) });
  const { data: batches = [] }   = useQuery({ queryKey: ["drug-batches", id], queryFn: () => listBatches(id) });
  const { data: movements = [] } = useQuery({ queryKey: ["drug-movements", id], queryFn: () => listMovements(id) });

  if (isLoading || !drug) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const now = Date.now();

  return (
    <div className="space-y-6 max-w-5xl">
      {showBatch && <BatchPanel drugId={id} drugCode={drug.code} onClose={() => setShowBatch(false)} />}

      <Link href="/drugs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Эм бүртгэл рүү буцах
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {drug.code && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{drug.code}</span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{drug.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {drug.form} · {drug.dosage} · {drug.unit}
            {drug.category ? ` · ${drug.category}` : ""}
            {drug.manufacturer ? ` · ${drug.manufacturer}` : ""}
          </p>
        </div>
        <Button onClick={() => setShowBatch(true)}>
          <Plus className="h-4 w-4" />Орлого нэмэх
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-5">
          <div className="text-xs text-muted-foreground">Нийт нөөц</div>
          <div className="text-2xl font-bold mt-1">{drug.stock} <span className="text-sm font-normal text-muted-foreground">{drug.unit}</span></div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-xs text-muted-foreground">Зарах үнэ</div>
          <div className="text-2xl font-bold mt-1">{fmt(drug.salePrice)}₮</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-xs text-muted-foreground">Доод хэмжээ</div>
          <div className="text-2xl font-bold mt-1">{drug.minStock} <span className="text-sm font-normal text-muted-foreground">{drug.unit}</span></div>
        </CardContent></Card>
      </div>

      {/* Batches */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="h-4 w-4 text-primary" />
            Цуврал ({batches.length}) <span className="text-xs font-normal text-muted-foreground">— FEFO дараалал</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {batches.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Цуврал бүртгэгдээгүй. «Орлого нэмэх»-ээр эхлүүлнэ үү.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">Цуврал</th>
                    <th className="text-left px-4 py-2.5 font-medium">Дуусах хугацаа</th>
                    <th className="text-right px-4 py-2.5 font-medium">Үлдэгдэл</th>
                    <th className="text-right px-4 py-2.5 font-medium">Анх</th>
                    <th className="text-right px-4 py-2.5 font-medium">Өртөг</th>
                    <th className="text-right px-4 py-2.5 font-medium">Зарах үнэ</th>
                    <th className="text-left px-4 py-2.5 font-medium">Нийлүүлэгч</th>
                    <th className="text-left px-4 py-2.5 font-medium">Орлогодсон</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => {
                    const exp = new Date(b.expiryDate).getTime();
                    const isExpired = exp <= now;
                    const isSoon = !isExpired && exp <= now + 30 * 86400000;
                    return (
                      <tr key={b.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{b.batchNumber}</td>
                        <td className="px-4 py-3">
                          <span className={isExpired ? "text-rose-600 font-medium" : isSoon ? "text-amber-600 font-medium" : ""}>
                            {dateStr(b.expiryDate)}
                          </span>
                          {isExpired && <Badge tone="destructive" className="ml-2">Дууссан</Badge>}
                          {isSoon && <Badge tone="warning" className="ml-2">Удахгүй</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{b.quantity}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{b.initialQuantity}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{fmt(b.costPrice)}₮</td>
                        <td className="px-4 py-3 text-right font-medium">{fmt(b.salePrice)}₮</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{b.supplier || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{dateStr(b.receivedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownUp className="h-4 w-4 text-primary" />Нөөцийн хөдөлгөөн
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Хөдөлгөөн алга.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="text-left px-4 py-2.5 font-medium">Төрөл</th>
                    <th className="text-right px-4 py-2.5 font-medium">Тоо</th>
                    <th className="text-left px-4 py-2.5 font-medium">Шалтгаан</th>
                    <th className="text-left px-4 py-2.5 font-medium">Бүртгэсэн</th>
                    <th className="text-left px-4 py-2.5 font-medium">Огноо</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          {MOVE_ICON[m.type]}{STOCK_MOVEMENT_LABELS_MN[m.type]}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${m.quantity >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{m.reason || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{m.createdByName || "—"}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{formatDateTimeMn(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
