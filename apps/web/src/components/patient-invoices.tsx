"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Loader2, Plus, X, ArrowRight } from "lucide-react";
import { INVOICE_STATUS_LABELS_MN } from "@his/shared";
import type { InvoiceStatus } from "@his/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { listInvoices } from "@/lib/billing-api";
import { INVOICE_TONE } from "@/lib/status-tones";
import { formatMnt } from "@/lib/format";
import { formatDateMn } from "@/lib/utils";

const FILTER_INPUT =
  "h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

const STATUS_OPTS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft",     label: "Ноорог" },
  { value: "issued",    label: "Гаргасан" },
  { value: "partial",   label: "Хэсэгчилсэн" },
  { value: "paid",      label: "Төлсөн" },
  { value: "cancelled", label: "Цуцалсан" },
];

export function PatientInvoices({ patientId }: { patientId: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  // Everyone can VIEW; only reception + admin can create/modify
  const canModify = user && (user.role === "admin" || user.role === "reception");

  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", { patientId }],
    queryFn:  () => listInvoices({ patientId, pageSize: 200 }),
  });
  const invoices = data?.items ?? [];

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter && inv.status !== statusFilter) return false;
      if (dateFrom && new Date(inv.issuedAt) < new Date(dateFrom)) return false;
      if (dateTo   && new Date(inv.issuedAt) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [invoices, statusFilter, dateFrom, dateTo]);

  const hasFilter = statusFilter || dateFrom || dateTo;
  const clearFilters = () => { setStatusFilter(""); setDateFrom(""); setDateTo(""); };

  /* summary totals for filtered set */
  const totals = useMemo(() => ({
    total:   filtered.reduce((s, i) => s + i.total, 0),
    paid:    filtered.reduce((s, i) => s + i.paid,  0),
    balance: filtered.reduce((s, i) => s + i.balance, 0),
  }), [filtered]);

  return (
    <Card>
      {/* ── Header ── */}
      <CardHeader className="py-3 px-5 border-b border-border flex-row items-center justify-between gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4 text-emerald-500" />
          Нэхэмжлэл
          {invoices.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {hasFilter ? `${filtered.length}/${invoices.length}` : invoices.length}
            </span>
          )}
        </CardTitle>
        {canModify && (
          <Button size="sm" variant="outline" onClick={() => router.push(`/billing/new?patientId=${patientId}`)}>
            <Plus className="h-3.5 w-3.5" /> Нэхэмжлэл
          </Button>
        )}
      </CardHeader>

      {/* ── Filter bar ── */}
      {invoices.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-muted/20 border-b border-border">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={FILTER_INPUT} />
          <span className="text-xs text-muted-foreground">—</span>
          <input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   className={FILTER_INPUT} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={FILTER_INPUT}>
            <option value="">Бүх статус</option>
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
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
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Нэхэмжлэл байхгүй</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Шүүлтэнд тохирох нэхэмжлэл олдсонгүй</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground w-28">Дугаар</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground w-32">Огноо</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground w-32">Нийт дүн</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground w-28">Төлсөн</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground w-28">Үлдэгдэл</th>
                    <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground w-28">Статус</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/billing/${inv.id}`)}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-5 py-3 text-xs font-mono text-muted-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateMn(inv.issuedAt)}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-right tabular-nums whitespace-nowrap">
                        {formatMnt(inv.total)}
                      </td>
                      <td className="px-3 py-3 text-xs text-emerald-700 font-medium text-right tabular-nums whitespace-nowrap">
                        {inv.paid > 0 ? formatMnt(inv.paid) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-right tabular-nums whitespace-nowrap">
                        {inv.balance > 0
                          ? <span className="text-rose-600 font-medium">{formatMnt(inv.balance)}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={INVOICE_TONE[inv.status]}>
                          {INVOICE_STATUS_LABELS_MN[inv.status]}
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

            {/* ── Summary footer ── */}
            {filtered.length > 1 && (
              <div className="flex items-center justify-end gap-6 px-5 py-2.5 border-t border-border bg-muted/10 text-xs">
                <span className="text-muted-foreground">
                  Нийт дүн: <span className="font-semibold text-foreground tabular-nums">{formatMnt(totals.total)}</span>
                </span>
                <span className="text-muted-foreground">
                  Төлсөн: <span className="font-semibold text-emerald-700 tabular-nums">{formatMnt(totals.paid)}</span>
                </span>
                {totals.balance > 0 && (
                  <span className="text-muted-foreground">
                    Үлдэгдэл: <span className="font-semibold text-rose-600 tabular-nums">{formatMnt(totals.balance)}</span>
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
