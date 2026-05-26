"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import {
  INVOICE_STATUS_LABELS_MN,
  PAYMENT_METHOD_LABELS_MN,
  type PaymentMethod,
} from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  getInvoice,
  recordPayment,
  cancelInvoice,
} from "@/lib/billing-api";
import { INVOICE_TONE } from "@/lib/status-tones";
import { formatMnt } from "@/lib/format";
import { formatDateTimeMn } from "@/lib/utils";
import { extractApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const METHODS: PaymentMethod[] = ["cash", "card", "transfer", "insurance"];

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("cash");

  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice(id),
  });

  const payMut = useMutation({
    mutationFn: () => recordPayment(id, { amount, method }),
    onSuccess: () => {
      toast({ title: "Төлбөр бүртгэлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setAmount(0);
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelInvoice(id),
    onSuccess: () => {
      toast({ title: "Цуцаллаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  if (isLoading || !inv) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canPay = user && (user.role === "admin" || user.role === "reception") && inv.balance > 0 && inv.status !== "cancelled";
  const canCancel = user && (user.role === "admin" || user.role === "manager") && inv.status !== "cancelled" && inv.paid === 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="text-xs text-muted-foreground font-mono">{inv.invoiceNumber}</div>
            <h1 className="text-2xl font-semibold tracking-tight">Нэхэмжлэл</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={INVOICE_TONE[inv.status]}>
            {INVOICE_STATUS_LABELS_MN[inv.status]}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Хэвлэх
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <Link href={`/patients/${inv.patientId}`} className="hover:underline">
                {inv.patientName}
              </Link>
            </CardTitle>
            <div className="text-xs text-muted-foreground font-mono">
              {inv.patientCode}
            </div>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Үйлчилгээ</th>
                  <th className="w-20 text-right">Тоо</th>
                  <th className="w-32 text-right">Үнэ</th>
                  <th className="w-32 text-right">Дүн</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.name}</td>
                    <td className="text-right">{it.quantity}</td>
                    <td className="text-right">{formatMnt(it.unitPrice)}</td>
                    <td className="text-right font-medium">{formatMnt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="text-right text-muted-foreground">
                    Дэд дүн
                  </td>
                  <td className="text-right">{formatMnt(inv.subtotal)}</td>
                </tr>
                {inv.discount > 0 ? (
                  <tr>
                    <td colSpan={3} className="text-right text-muted-foreground">
                      Хөнгөлөлт
                    </td>
                    <td className="text-right">−{formatMnt(inv.discount)}</td>
                  </tr>
                ) : null}
                <tr>
                  <td colSpan={3} className="text-right font-semibold">
                    Нийт дүн
                  </td>
                  <td className="text-right font-semibold">{formatMnt(inv.total)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right text-emerald-700">
                    Төлсөн
                  </td>
                  <td className="text-right text-emerald-700">{formatMnt(inv.paid)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="text-right font-semibold">
                    Үлдэгдэл
                  </td>
                  <td className="text-right font-semibold">{formatMnt(inv.balance)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {canPay ? (
            <Card>
              <CardHeader>
                <CardTitle>Төлбөр бүртгэх</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Дүн</Label>
                  <Input
                    type="number"
                    min={0}
                    max={inv.balance}
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Үлдэгдэл: {formatMnt(inv.balance)}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Хэлбэр</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {PAYMENT_METHOD_LABELS_MN[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={() => payMut.mutate()}
                  disabled={!amount || amount > inv.balance || payMut.isPending}
                >
                  Бүртгэх
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {canCancel ? (
            <Card>
              <CardContent className="p-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  size="sm"
                  onClick={() => cancelMut.mutate()}
                  disabled={cancelMut.isPending}
                >
                  Нэхэмжлэл цуцлах
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Төлбөрийн түүх</CardTitle>
            </CardHeader>
            <CardContent>
              {inv.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Төлбөр бүртгээгүй
                </p>
              ) : (
                <ul className="space-y-2">
                  {inv.payments.map((p, idx) => (
                    <li key={idx} className="text-sm border-l-2 border-primary/40 pl-3">
                      <div className="font-medium">{formatMnt(p.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABELS_MN[p.method]} ·{" "}
                        {formatDateTimeMn(p.paidAt)}
                        {p.receivedBy ? ` · ${p.receivedBy}` : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
