"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FlaskConical, Plus, Loader2, XCircle, Settings, Printer,
} from "lucide-react";
import {
  LAB_ORDER_STATUS_LABELS_MN,
  LAB_PRIORITY_LABELS_MN,
  type LabOrderStatus,
} from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { listLabOrders, cancelLabOrder, listLabTests } from "@/lib/lab-api";
import { getPatient } from "@/lib/patients-api";
import { getPrintConfig } from "@/lib/print-config-api";
import { printRequisition } from "@/lib/lab-print";
import { LAB_ORDER_TONE } from "@/lib/status-tones";
import { extractApiError } from "@/lib/api";
import { formatTimeMn, toDateInput } from "@/lib/format";
import type { LabOrder } from "@his/shared";

const STATUSES: { value: string; label: string }[] = [
  { value: "",          label: "Бүгд" },
  { value: "ordered",   label: "Хүлээгдэж буй" },
  { value: "partial",   label: "Хэсэгчилсэн" },
  { value: "completed", label: "Бүрэн хариутай" },
  { value: "cancelled", label: "Цуцлагдсан" },
];

const PRIORITY_TONE: Record<string, string> = {
  routine: "text-muted-foreground",
  urgent:  "text-amber-600 font-medium",
  stat:    "text-rose-600 font-bold",
};

export default function LabPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [status, setStatus]   = useState("");
  const [from,   setFrom]     = useState(toDateInput(new Date(Date.now() - 7 * 86400_000)));
  const [to,     setTo]       = useState(toDateInput(new Date()));

  const { data, isLoading } = useQuery({
    queryKey: ["lab-orders", status, from, to],
    queryFn: () => listLabOrders({ status: status || undefined, from, to, pageSize: 50 }),
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["lab-tests-all"],
    queryFn: () => listLabTests(true),
    staleTime: 5 * 60_000,
  });
  const { data: printConfig } = useQuery({
    queryKey: ["print-config"],
    queryFn: getPrintConfig,
    staleTime: 5 * 60_000,
  });

  const [printingId, setPrintingId] = useState<string | null>(null);
  const handlePrintReq = async (order: LabOrder) => {
    setPrintingId(order.id);
    try {
      const patient = await getPatient(order.patientId).catch(() => undefined);
      printRequisition(order, patient ?? undefined, catalog, printConfig);
    } catch (e) {
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" });
    } finally {
      setPrintingId(null);
    }
  };

  const cancel = useMutation({
    mutationFn: cancelLabOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lab-orders"] });
      toast({ title: "Захиалга цуцлагдлаа", variant: "success" });
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const canCreate = user && ["admin","doctor"].includes(user.role);
  const isAdmin   = user?.role === "admin";

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-violet-600" />
            Лабораторийн шинжилгээ
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Захиалга болон шинжилгээний хариу
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/lab/catalog">
                <Settings className="h-4 w-4" />
                Каталог
              </Link>
            </Button>
          )}
          {canCreate && (
            <Button asChild>
              <Link href="/lab/orders/new">
                <Plus className="h-4 w-4" />
                Шинжилгээ захиалах
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Огноо:</span>
          <input
            type="date" value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <span>–</span>
          <input
            type="date" value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex gap-1 ml-auto flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                status === s.value
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Дугаар</th>
                <th>Огноо</th>
                <th>Өвчтөн</th>
                <th>Эмч</th>
                <th>Шинжилгээнүүд</th>
                <th>Яаралтай байдал</th>
                <th>Статус</th>
                <th className="text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </td></tr>
              ) : !data?.items.length ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">
                  Захиалга байхгүй байна
                </td></tr>
              ) : (
                data.items.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/lab/orders/${order.id}`}
                        className="font-mono text-xs text-primary hover:underline font-medium">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="text-xs font-mono text-muted-foreground">
                      {formatTimeMn(order.orderedAt)}
                    </td>
                    <td>
                      <Link href={`/patients/${order.patientId}`} className="hover:underline">
                        <div className="font-medium text-sm">{order.patientName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{order.patientCode}</div>
                      </Link>
                    </td>
                    <td className="text-sm">{order.doctorName}</td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {order.items.slice(0, 3).map((item) => (
                          <span key={item.testId}
                            className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                            {item.testCode}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`text-xs ${PRIORITY_TONE[order.priority]}`}>
                        {LAB_PRIORITY_LABELS_MN[order.priority]}
                      </span>
                    </td>
                    <td>
                      <Badge tone={LAB_ORDER_TONE[order.status as LabOrderStatus]}>
                        {LAB_ORDER_STATUS_LABELS_MN[order.status as LabOrderStatus]}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => handlePrintReq(order)}
                          disabled={printingId === order.id}
                          title="Шинжилгээний бичиг хэвлэх"
                        >
                          {printingId === order.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Printer className="h-3.5 w-3.5" />}
                          Ш/бичиг
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/lab/orders/${order.id}`}>
                            {order.status === "ordered" || order.status === "partial"
                              ? "Хариу оруулах" : "Харах"}
                          </Link>
                        </Button>
                        {canCreate && order.status === "ordered" && (
                          <Button
                            size="sm" variant="ghost"
                            onClick={() => cancel.mutate(order.id)}
                            disabled={cancel.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="p-3 border-t border-border text-xs text-muted-foreground text-right">
            Нийт {data.total} захиалга
          </div>
        )}
      </Card>
    </div>
  );
}
