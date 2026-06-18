"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Plus, Loader2, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { INVOICE_STATUS_LABELS_MN, type InvoiceStatus } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listInvoices } from "@/lib/billing-api";
import { INVOICE_TONE } from "@/lib/status-tones";
import { formatMnt } from "@/lib/format";
import { formatDateTimeMn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";

const STATUS_OPTIONS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "issued", label: "Гаргасан" },
  { value: "partial", label: "Хэсэгчилсэн" },
  { value: "paid", label: "Төлсөн" },
  { value: "cancelled", label: "Цуцалсан" },
];

export default function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", { status, page }],
    queryFn: () =>
      listInvoices({
        status: status === "all" ? undefined : status,
        page,
        pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const canCreate = user && (user.role === "admin" || user.role === "reception");
  const canManageServices = user && (user.role === "admin" || user.role === "manager" || user.role === "reception");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Төлбөр
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Нэхэмжлэлийн жагсаалт
          </p>
        </div>
        <div className="flex gap-2">
          {canManageServices ? (
            <Button variant="outline" asChild>
              <Link href="/billing/services">
                <Settings className="h-4 w-4" />
                Үйлчилгээ
              </Link>
            </Button>
          ) : null}
          {canCreate ? (
            <Button asChild>
              <Link href="/billing/new">
                <Plus className="h-4 w-4" />
                Шинэ нэхэмжлэл
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Статус:</span>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Дугаар</th>
                <th>Өвчтөн</th>
                <th className="text-right">Дүн</th>
                <th className="text-right">Төлсөн</th>
                <th className="text-right">Үлдэгдэл</th>
                <th>Статус</th>
                <th>Огноо</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link
                        href={`/billing/${inv.id}`}
                        className="text-primary hover:underline font-mono text-xs"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/patients/${inv.patientId}`} className="hover:underline">
                        <div className="font-medium">{inv.patientName}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {inv.patientCode}
                        </div>
                      </Link>
                    </td>
                    <td className="text-right font-medium">{formatMnt(inv.total)}</td>
                    <td className="text-right">{formatMnt(inv.paid)}</td>
                    <td className="text-right">{formatMnt(inv.balance)}</td>
                    <td>
                      <Badge tone={INVOICE_TONE[inv.status]}>
                        {INVOICE_STATUS_LABELS_MN[inv.status]}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {formatDateTimeMn(inv.issuedAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    Нэхэмжлэл алга
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 ? (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
            <span className="text-muted-foreground">
              Нийт {data.total} нэхэмжлэл · хуудас {data.page}/{totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Өмнөх
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Дараах
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
