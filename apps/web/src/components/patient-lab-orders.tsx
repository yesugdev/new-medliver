"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FlaskConical, Loader2, Plus, X, Search, CheckCircle2, ArrowRight,
} from "lucide-react";
import { LAB_ORDER_STATUS_LABELS_MN } from "@his/shared";
import type { LabOrderStatus } from "@his/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { listLabOrders, listLabTests, createLabOrder } from "@/lib/lab-api";
import { LAB_ORDER_TONE } from "@/lib/status-tones";
import { formatDateTimeMn } from "@/lib/utils";
import { extractApiError } from "@/lib/api";

const FILTER_INPUT =
  "h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

const STATUS_OPTS: { value: LabOrderStatus; label: string }[] = [
  { value: "ordered",   label: "Хүлээгдэж буй" },
  { value: "partial",   label: "Хэсэгчилсэн" },
  { value: "completed", label: "Бүрэн хариутай" },
  { value: "cancelled", label: "Цуцлагдсан" },
];

/* ─── Quick-order inline form ───────────────────────────────────── */
function QuickOrderForm({ patientId, onDone }: { patientId: string; onDone: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [labName, setLabName] = useState("");

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["lab-tests-all"],
    queryFn: () => listLabTests(true),
  });

  const filtered = search.trim()
    ? tests.filter((t) => {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.testGroup ?? "").toLowerCase().includes(q)
        );
      })
    : tests;

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const mutation = useMutation({
    mutationFn: () => createLabOrder({ patientId, testIds: selected, labName: labName.trim() || undefined }),
    onSuccess: () => {
      toast({ title: "Шинжилгээ захиалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["lab-orders-by-patient", patientId] });
      onDone();
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  return (
    <div className="p-4 bg-violet-50/60 border-b border-violet-200 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Шинжилгээ хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.map((id) => {
              const t = tests.find((x) => x.id === id);
              return t ? (
                <span key={id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300">
                  {t.code}
                  <button onClick={() => toggle(id)}><X className="h-2.5 w-2.5" /></button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      <div className="border rounded-md max-h-48 overflow-y-auto divide-y bg-white">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Олдсонгүй</p>
        ) : (
          filtered.slice(0, 40).map((t) => {
            const checked = selected.includes(t.id);
            return (
              <button
                key={t.id} type="button" onClick={() => toggle(t.id)}
                className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${checked ? "bg-violet-50" : "hover:bg-muted/30"}`}
              >
                <span className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center transition-colors ${checked ? "bg-violet-600 border-violet-600" : "border-border bg-white"}`}>
                  {checked && <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className="font-mono text-xs text-muted-foreground w-14 shrink-0">{t.code}</span>
                <span className="flex-1 min-w-0 truncate">{t.name}</span>
                {t.testGroup && <span className="text-[10px] text-violet-400 shrink-0">{t.testGroup}</span>}
              </button>
            );
          })
        )}
      </div>

      <Input
        placeholder="Шинжилгээ хийх эмнэлэг (заавал биш)"
        value={labName}
        onChange={(e) => setLabName(e.target.value)}
        className="h-8 text-sm max-w-sm"
      />

      <div className="flex gap-2">
        <Button size="sm" onClick={() => mutation.mutate()} disabled={selected.length === 0 || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Захиалах{selected.length > 0 ? ` (${selected.length})` : ""}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Болих</Button>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
export function PatientLabOrders({ patientId }: { patientId: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canOrder = user && (user.role === "admin" || user.role === "doctor");

  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo,   setDateTo]     = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["lab-orders-by-patient", patientId],
    queryFn:  () => listLabOrders({ patientId, pageSize: 200 }),
  });
  const orders = data?.items ?? [];

  const doctors = useMemo(
    () => [...new Set(orders.map((o) => o.doctorName))].sort(),
    [orders],
  );

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (doctorFilter && o.doctorName !== doctorFilter) return false;
      if (dateFrom && new Date(o.orderedAt) < new Date(dateFrom)) return false;
      if (dateTo   && new Date(o.orderedAt) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [orders, statusFilter, doctorFilter, dateFrom, dateTo]);

  const hasFilter = statusFilter || doctorFilter || dateFrom || dateTo;
  const clearFilters = () => {
    setStatusFilter(""); setDoctorFilter(""); setDateFrom(""); setDateTo("");
  };

  return (
    <Card>
      {/* ── Header ── */}
      <CardHeader className="py-3 px-5 border-b border-border flex-row items-center justify-between gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-violet-500" />
          Шинжилгээний түүх
          {orders.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {hasFilter ? `${filtered.length}/${orders.length}` : orders.length}
            </span>
          )}
        </CardTitle>
        {canOrder && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Захиалах
          </Button>
        )}
      </CardHeader>

      {/* ── Quick order form ── */}
      {showForm && <QuickOrderForm patientId={patientId} onDone={() => setShowForm(false)} />}

      {/* ── Filter bar ── */}
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-muted/20 border-b border-border">
          {/* Date range */}
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={FILTER_INPUT} />
          <span className="text-xs text-muted-foreground">—</span>
          <input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   className={FILTER_INPUT} />
          {/* Status */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={FILTER_INPUT}>
            <option value="">Бүх статус</option>
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Doctor */}
          {doctors.length > 1 && (
            <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className={FILTER_INPUT}>
              <option value="">Бүх эмч</option>
              {doctors.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {/* Clear */}
          {hasFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" /> Арилгах
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Шинжилгээний захиалга байхгүй</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Шүүлтэнд тохирох захиалга олдсонгүй</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground w-36">Огноо</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground w-28">Дугаар</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Эмч</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Шинжилгээ</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground w-32">Статус</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/lab/orders/${order.id}?from=patient`)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {formatDateTimeMn(order.orderedAt)}
                    </td>
                    <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-violet-700 whitespace-nowrap">
                      {order.doctorName}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {order.items.slice(0, 5).map((item) => (
                          <span key={item.testId} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 font-mono">
                            {item.testCode}
                          </span>
                        ))}
                        {order.items.length > 5 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            +{order.items.length - 5}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={LAB_ORDER_TONE[order.status]}>
                        {LAB_ORDER_STATUS_LABELS_MN[order.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
