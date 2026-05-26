"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Loader2, CheckCircle2, FlaskConical, AlertTriangle, XCircle,
} from "lucide-react";
import {
  LAB_ORDER_STATUS_LABELS_MN,
  LAB_PRIORITY_LABELS_MN,
  LAB_CATEGORY_LABELS_MN,
  LAB_INTERPRETATION_LABELS_MN,
  type LabOrderStatus,
  type LabInterpretation,
  type LabCategory,
  type LabOrderItem,
} from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { getLabOrder, recordLabResults, cancelLabOrder } from "@/lib/lab-api";
import { LAB_ORDER_TONE, LAB_INTERP_TONE } from "@/lib/status-tones";
import { extractApiError } from "@/lib/api";
import { formatTimeMn } from "@/lib/format";

/* ─── Auto-interpret in the browser (mirrors backend logic) ────────── */
function autoInterpret(
  value: string,
  min?: number,
  max?: number,
): LabInterpretation | undefined {
  const n = parseFloat(value);
  if (isNaN(n) || (min == null && max == null)) return undefined;
  if (min != null && n < min * 0.7) return "critical_low";
  if (max != null && n > max * 1.3) return "critical_high";
  if (min != null && n < min)        return "low";
  if (max != null && n > max)        return "high";
  return "normal";
}

/* ─── Interpretation badge ──────────────────────────────────────────── */
function InterpBadge({ interp }: { interp?: LabInterpretation }) {
  if (!interp) return null;
  return (
    <Badge tone={LAB_INTERP_TONE[interp]} className="text-[10px]">
      {interp === "critical_low" || interp === "critical_high"
        ? <AlertTriangle className="h-2.5 w-2.5 mr-0.5 inline" /> : null}
      {LAB_INTERPRETATION_LABELS_MN[interp]}
    </Badge>
  );
}

/* ─── Single result row ─────────────────────────────────────────────── */
function ResultRow({
  item,
  editable,
  value,
  onChange,
}: {
  item: LabOrderItem;
  editable: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const preview = value.trim()
    ? autoInterpret(value, item.referenceMin, item.referenceMax)
    : item.interpretation;

  const isCritical =
    preview === "critical_low" || preview === "critical_high";

  return (
    <tr className={isCritical ? "bg-rose-50/50" : ""}>
      <td>
        <div className="font-medium text-sm">{item.testName}</div>
        <div className="text-[11px] font-mono text-muted-foreground">{item.testCode}</div>
      </td>
      <td className="text-xs text-muted-foreground">
        {item.unit ?? "—"}
      </td>
      <td className="text-xs text-muted-foreground">
        {item.referenceMin != null && item.referenceMax != null
          ? `${item.referenceMin} – ${item.referenceMax}`
          : item.referenceText ?? "—"}
      </td>
      <td>
        {editable && item.status !== "cancelled" ? (
          item.inputType === "select" && item.options?.length ? (
            <select
              className={`h-7 text-sm rounded-md border bg-background px-2 w-36 ${
                isCritical ? "border-rose-400" : "border-input"
              }`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">— сонгох —</option>
              {item.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <Input
              type="text"
              className={`h-7 text-sm w-28 ${
                isCritical ? "border-rose-400 focus:ring-rose-300" : ""
              }`}
              placeholder={item.status === "resulted" ? item.value : "Утга оруулах"}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )
        ) : (
          <span className={`text-sm font-medium ${
            item.status === "resulted" && item.interpretation !== "normal"
              ? "text-rose-600"
              : ""
          }`}>
            {item.value ?? "—"}
          </span>
        )}
      </td>
      <td>
        <InterpBadge interp={value.trim() ? preview : item.interpretation} />
      </td>
      <td>
        {item.status === "resulted" ? (
          <Badge tone="success" className="text-[10px]">Хариутай</Badge>
        ) : item.status === "cancelled" ? (
          <Badge tone="muted" className="text-[10px]">Цуцлагдсан</Badge>
        ) : (
          <Badge tone="info" className="text-[10px]">Хүлээгдэж буй</Badge>
        )}
      </td>
      <td className="text-[11px] text-muted-foreground">
        {item.resultedAt ? (
          <>
            <div>{formatTimeMn(item.resultedAt)}</div>
            {item.resultedByName && (
              <div className="font-medium text-violet-700">{item.resultedByName}</div>
            )}
          </>
        ) : "—"}
      </td>
    </tr>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function LabOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [resultValues, setResultValues] = useState<Record<string, string>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: ["lab-order", id],
    queryFn: () => getLabOrder(id),
  });

  /* Pre-fill inputs with existing results when order loads */
  useEffect(() => {
    if (order) {
      const init: Record<string, string> = {};
      for (const item of order.items) {
        if (item.value) init[item.testId] = item.value;
      }
      setResultValues(init);
    }
  }, [order?.id]);

  const saveResults = useMutation({
    mutationFn: () => {
      const items = Object.entries(resultValues)
        .filter(([, v]) => v.trim() !== "")
        .map(([testId, value]) => ({ testId, value: value.trim() }));
      if (items.length === 0) throw new Error("Хариу оруулаагүй байна");
      return recordLabResults(id, items);
    },
    onSuccess: () => {
      toast({ title: "Хариу хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-order", id] });
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const cancelOrder = useMutation({
    mutationFn: () => cancelLabOrder(id),
    onSuccess: () => {
      toast({ title: "Захиалга цуцлагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-order", id] });
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const canEdit = user && ["admin","doctor"].includes(user.role);
  const isEditable =
    canEdit &&
    order &&
    (order.status === "ordered" || order.status === "partial");

  const pendingCount = Object.values(resultValues).filter((v) => v.trim() !== "").length;

  /* Group items by category */
  const groupedItems = order?.items.reduce<Record<string, LabOrderItem[]>>((acc, item) => {
    // find category from test code prefix — not ideal; just use "all" for now
    (acc["all"] ??= []).push(item);
    return acc;
  }, {}) ?? {};

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 text-muted-foreground">Захиалга олдсонгүй</div>
  );

  const statusTone = LAB_ORDER_TONE[order.status as LabOrderStatus];
  const resulted = order.items.filter((i) => i.status === "resulted").length;
  const total    = order.items.filter((i) => i.status !== "cancelled").length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/lab"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-violet-600" />
            {order.orderNumber}
          </h1>
          <Badge tone={statusTone}>
            {LAB_ORDER_STATUS_LABELS_MN[order.status as LabOrderStatus]}
          </Badge>
          <span className={`text-xs font-medium ${
            order.priority === "stat"   ? "text-rose-600" :
            order.priority === "urgent" ? "text-amber-600" :
            "text-muted-foreground"
          }`}>
            {LAB_PRIORITY_LABELS_MN[order.priority as import("@his/shared").LabPriority]}
          </span>
        </div>
        {canEdit && order.status === "ordered" && (
          <Button
            variant="ghost" size="sm"
            onClick={() => cancelOrder.mutate()}
            disabled={cancelOrder.isPending}
            className="text-rose-600 hover:text-rose-700"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Цуцлах
          </Button>
        )}
      </div>

      {/* ── Info cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Өвчтөн",    value: order.patientName,                href: `/patients/${order.patientId}` },
          { label: "Код",       value: order.patientCode,                 mono: true },
          { label: "Эмч",       value: order.doctorName },
          { label: "Огноо",     value: formatTimeMn(order.orderedAt),    mono: true },
        ].map((info) => (
          <div key={info.label} className="bg-muted/30 rounded-lg px-3 py-2.5">
            <div className="text-[11px] text-muted-foreground">{info.label}</div>
            {info.href ? (
              <Link href={info.href}
                className={`text-sm font-medium hover:underline ${info.mono ? "font-mono" : ""}`}>
                {info.value}
              </Link>
            ) : (
              <div className={`text-sm font-medium ${info.mono ? "font-mono" : ""}`}>
                {info.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-violet-500 transition-all duration-500"
            style={{ width: total ? `${(resulted / total) * 100}%` : "0%" }}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {resulted}/{total} хариутай
        </span>
      </div>

      {order.clinicalNote && (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="font-medium text-amber-800">Клиникийн тэмдэглэл: </span>
          <span className="text-amber-700">{order.clinicalNote}</span>
        </div>
      )}

      {/* ── Results table ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border py-3 px-5 flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Шинжилгээний хариу</CardTitle>
          {isEditable && (
            <Button
              size="sm"
              onClick={() => saveResults.mutate()}
              disabled={saveResults.isPending || pendingCount === 0}
            >
              {saveResults.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle2 className="h-4 w-4" />}
              Хадгалах {pendingCount > 0 ? `(${pendingCount})` : ""}
            </Button>
          )}
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Шинжилгээ</th>
                <th>Нэгж</th>
                <th>Лавлах утга</th>
                <th>Хариу</th>
                <th>Дүгнэлт</th>
                <th>Статус</th>
                <th>Бүртгэсэн</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const groups = new Map<string, typeof order.items>();
                for (const item of order.items) {
                  const g = item.testGroup ?? "";
                  const arr = groups.get(g) ?? [];
                  arr.push(item);
                  groups.set(g, arr);
                }
                return [...groups.entries()].map(([grp, items]) => (
                  <React.Fragment key={grp || "__no_group__"}>
                    {grp && (
                      <tr className="bg-muted/40">
                        <td colSpan={7} className="py-1.5 px-3 text-[11px] font-semibold text-muted-foreground">
                          {grp}
                        </td>
                      </tr>
                    )}
                    {items.map((item) => (
                      <ResultRow
                        key={item.testId}
                        item={item}
                        editable={!!isEditable}
                        value={resultValues[item.testId] ?? ""}
                        onChange={(v) =>
                          setResultValues((prev) => ({ ...prev, [item.testId]: v }))
                        }
                      />
                    ))}
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {isEditable && (
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Утга оруулаад <strong>Хадгалах</strong> дарна. Тоон утгыг автоматаар дүгнэлт тооцоолно.
            </p>
            <Button
              onClick={() => saveResults.mutate()}
              disabled={saveResults.isPending || pendingCount === 0}
            >
              {saveResults.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle2 className="h-4 w-4" />}
              Бүгдийг хадгалах {pendingCount > 0 ? `(${pendingCount})` : ""}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
