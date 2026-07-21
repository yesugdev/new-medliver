"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import type { PrintConfig } from "@his/shared";
import { getPrintConfig } from "@/lib/print-config-api";
import { openPrintWindow, buildPatientMeta, cfg, type PrintPatientInfo } from "@/lib/print-utils";
import { getPatient } from "@/lib/patients-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Loader2, CheckCircle2, FlaskConical, AlertTriangle, XCircle, Printer,
  Pencil, Trash2,
} from "lucide-react";
import {
  LAB_ORDER_STATUS_LABELS_MN,
  LAB_PRIORITY_LABELS_MN,
  LAB_INTERPRETATION_LABELS_MN,
  type LabOrderStatus,
  type LabInterpretation,
  type LabOrderItem,
} from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { getLabOrder, recordLabResults, cancelLabOrder, deleteLabResult, updateLabOrderDate, listLabTests } from "@/lib/lab-api";
import { listLabCategories } from "@/lib/lab-categories-api";
import { printRequisition } from "@/lib/lab-print";
import { LAB_ORDER_TONE, LAB_INTERP_TONE } from "@/lib/status-tones";
import { extractApiError } from "@/lib/api";
import { formatTimeMn } from "@/lib/format";

/* ─── Print lab order ────────────────────────────────────────────────── */
const INTERP_LABELS: Record<string, string> = {
  normal: "Хэвийн", low: "Бага", high: "Их",
  critical_low: "Маш бага", critical_high: "Маш их",
};


function printLabOrder(
  order: import("@his/shared").LabOrder,
  config?: Partial<PrintConfig>,
  patient?: PrintPatientInfo,
) {

  const interpColor: Record<string, string> = {
    normal:        "#16a34a",
    low:           "#2563eb",
    high:          "#dc2626",
    critical_low:  "#7c3aed",
    critical_high: "#b91c1c",
  };

  const groups = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const g = item.testGroup ?? "";
    (groups.get(g) ?? groups.set(g, []).get(g)!).push(item);
  }

  const rows = [...groups.entries()].map(([grp, items]) => `
    ${grp ? `<tr style="background:#f1f5f9"><td colspan="7" style="padding:6px 12px;font-size:11px;font-weight:700;color:#475569;letter-spacing:.5px;text-transform:uppercase">${grp}</td></tr>` : ""}
    ${items.map((it, i) => {
      const isCritical = it.interpretation === "critical_low" || it.interpretation === "critical_high";
      const color = it.interpretation ? interpColor[it.interpretation] ?? "#374151" : "#374151";
      const ref = it.referenceMin != null && it.referenceMax != null
        ? `${it.referenceMin} – ${it.referenceMax}`
        : it.referenceText ?? "—";
      return `
      <tr style="background:${isCritical ? "#fff1f2" : i % 2 === 0 ? "#fff" : "#f8fafc"};border-bottom:1px solid #e2e8f0">
        <td style="padding:7px 12px;font-size:12px;font-weight:500">${it.testName}</td>
        <td style="padding:7px 12px;font-size:11px;color:#64748b;font-family:monospace">${it.testCode}</td>
        <td style="padding:7px 12px;font-size:11px;color:#64748b">${it.unit ?? "—"}</td>
        <td style="padding:7px 12px;font-size:11px;color:#64748b">${ref}</td>
        <td style="padding:7px 12px;font-size:13px;font-weight:600;color:${color}">${it.value ?? "—"}</td>
        <td style="padding:7px 12px;font-size:11px;color:${color}">${it.interpretation ? (INTERP_LABELS[it.interpretation] ?? it.interpretation) : "—"}</td>
        <td style="padding:7px 12px;font-size:11px;color:#64748b">${it.resultedByName ?? "—"}</td>
      </tr>`;
    }).join("")}
  `).join("");

  const c = cfg(config);
  const patientBlock = patient
    ? buildPatientMeta(patient, c)
    : `<div class="p-meta">
        <div class="p-meta-block"><span>Өвчтөн</span><strong>${order.patientName}</strong></div>
        <div class="p-meta-block"><span>Код</span><strong style="font-family:monospace">${order.patientCode}</strong></div>
       </div>`;

  openPrintWindow("Шинжилгээний хариу", "ШИНЖИЛГЭЭНИЙ ХАРИУ / LAB REPORT", `
    ${patientBlock}
    <div class="p-meta" style="margin-bottom:12px">
      <div class="p-meta-block"><span>Захиалгын дугаар</span><strong style="font-family:monospace">${order.orderNumber}</strong></div>
      <div class="p-meta-block"><span>Захиалсан эмч</span><strong>${order.doctorName}</strong></div>
      <div class="p-meta-block" style="text-align:right"><span>Огноо</span><strong>${new Date(order.orderedAt).toLocaleString("mn-MN")}</strong></div>
    </div>
    ${order.clinicalNote ? `<div style="font-size:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:4px;padding:8px 12px;margin-bottom:14px"><b>Клиникийн тэмдэглэл:</b> ${order.clinicalNote}</div>` : ""}
    <table>
      <thead><tr>
        <th>Шинжилгээ</th><th>Код</th><th>Нэгж</th><th>Лавлах утга</th>
        <th>Хариу</th><th>Дүгнэлт</th><th>Бүртгэсэн</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `, config);
}

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
  canDelete,
  onDelete,
  deleting,
}: {
  item: LabOrderItem;
  editable: boolean;
  value: string;
  onChange: (v: string) => void;
  canDelete?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
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
      {canDelete && (
        <td>
          {item.status === "resulted" && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label="Хариу устгах"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </td>
      )}
    </tr>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function LabOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const fromPatient = searchParams.get("from") === "patient";
  const { toast } = useToast();

  const { data: printConfig } = useQuery({
    queryKey: ["print-config"],
    queryFn: getPrintConfig,
    staleTime: 5 * 60_000,
  });

  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [resultValues, setResultValues] = useState<Record<string, string>>({});
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["lab-order", id],
    queryFn: () => getLabOrder(id),
  });

  const { data: patientData } = useQuery({
    queryKey: ["patient", order?.patientId],
    queryFn: () => getPatient(order!.patientId),
    enabled: !!order?.patientId,
    staleTime: 10 * 60_000,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["lab-tests-all"],
    queryFn: () => listLabTests(true),
    staleTime: 5 * 60_000,
  });

  const { data: categoryDefs = [] } = useQuery({
    queryKey: ["lab-categories"],
    queryFn: () => listLabCategories(false),
    staleTime: 5 * 60_000,
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
      toast({
        title: adminEditMode ? "Шинжилгээний хариу амжилттай шинэчлэгдлээ." : "Хариу хадгалагдлаа",
        variant: "success",
      });
      setAdminEditMode(false);
      qc.invalidateQueries({ queryKey: ["lab-order", id] });
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
      qc.invalidateQueries({ queryKey: ["lab-orders-by-patient"] });
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const deleteResult = useMutation({
    mutationFn: (testId: string) => deleteLabResult(id, testId),
    onMutate: (testId: string) => setDeletingTestId(testId),
    onSuccess: (_data, testId) => {
      toast({ title: "Шинжилгээний хариу амжилттай устгагдлаа.", variant: "success" });
      setResultValues((prev) => {
        const next = { ...prev };
        delete next[testId];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["lab-order", id] });
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
      qc.invalidateQueries({ queryKey: ["lab-orders-by-patient"] });
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
    onSettled: () => setDeletingTestId(null),
  });

  const updateDate = useMutation({
    mutationFn: () => {
      const [yy, mm, dd] = dateInput.split("-").map(Number);
      const now = new Date();
      const stamp = new Date(yy, mm - 1, dd, now.getHours(), now.getMinutes(), now.getSeconds());
      return updateLabOrderDate(id, stamp.toISOString());
    },
    onSuccess: () => {
      toast({ title: "Огноо амжилттай шинэчлэгдлээ.", variant: "success" });
      setEditingDate(false);
      qc.invalidateQueries({ queryKey: ["lab-order", id] });
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
      qc.invalidateQueries({ queryKey: ["lab-orders-by-patient"] });
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
  const isAdmin = user?.role === "admin";
  const normallyEditable =
    !!canEdit &&
    !!order &&
    (order.status === "ordered" || order.status === "partial");
  const isEditable = normallyEditable || (isAdmin && adminEditMode);
  const showAdminEditToggle =
    isAdmin && !!order && order.status !== "cancelled" && !normallyEditable;

  const handleDeleteResult = (item: LabOrderItem) => {
    if (confirm("Та энэ шинжилгээний хариуг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.")) {
      deleteResult.mutate(item.testId);
    }
  };

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
          <Link href={fromPatient && order ? `/patients/${order.patientId}` : "/lab"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
        <Button variant="outline" size="sm" onClick={() => printLabOrder(order, printConfig, patientData ? {
          name: `${patientData.lastName} ${patientData.firstName}`,
          patientCode: patientData.patientCode,
          registerNumber: patientData.registerNumber,
          birthDate: patientData.birthDate,
          gender: patientData.gender,
          phone: patientData.phone,
          address: patientData.address,
          bloodType: patientData.bloodType,
          attendingDoctorName: patientData.attendingDoctorName,
        } : undefined)}>
          <Printer className="h-4 w-4" />
          Хэвлэх
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => printRequisition(order, patientData, catalog, printConfig, categoryDefs)}
        >
          <Printer className="h-4 w-4" />
          Шинжилгээний бичиг
        </Button>
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
          ...(order.labName ? [{ label: "Эмнэлэг", value: order.labName }] : []),
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

        {/* Огноо — admin засварлах боломжтой */}
        <div className="bg-muted/30 rounded-lg px-3 py-2.5">
          <div className="text-[11px] text-muted-foreground">Огноо</div>
          {editingDate ? (
            <div className="flex items-center gap-1 mt-0.5">
              <Input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="h-7 text-xs"
              />
              <button
                type="button"
                onClick={() => updateDate.mutate()}
                disabled={!dateInput || updateDate.isPending}
                aria-label="Хадгалах"
                className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
              >
                {updateDate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setEditingDate(false)}
                aria-label="Болих"
                className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <XCircle className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium font-mono">{formatTimeMn(order.orderedAt)}</span>
              {isAdmin && order.status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => {
                    setDateInput(order.orderedAt.slice(0, 10));
                    setEditingDate(true);
                  }}
                  aria-label="Огноо засах"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
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
          <div className="flex items-center gap-2">
            {showAdminEditToggle && (
              <Button size="sm" variant="outline" onClick={() => setAdminEditMode(true)}>
                <Pencil className="h-4 w-4" />
                Засах
              </Button>
            )}
            {isAdmin && adminEditMode && (
              <Button size="sm" variant="ghost" onClick={() => setAdminEditMode(false)}>
                Болих
              </Button>
            )}
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
          </div>
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
                {isAdmin && <th>Үйлдэл</th>}
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
                        <td colSpan={isAdmin ? 8 : 7} className="py-1.5 px-3 text-[11px] font-semibold text-muted-foreground">
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
                        canDelete={isAdmin}
                        onDelete={() => handleDeleteResult(item)}
                        deleting={deletingTestId === item.testId}
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
