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
import { formatDateTimeMn, formatDateMn } from "@/lib/utils";
import { extractApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Invoice } from "@his/shared";

const METHODS: PaymentMethod[] = ["cash", "card", "transfer", "insurance"];

/* ─── Print invoice ─────────────────────────────────────────────────── */
function PrintInvoice({ inv }: { inv: Invoice }) {
  return (
    <div
      className="print-only"
      style={{ display: "none", fontFamily: "Arial, sans-serif", color: "#000", fontSize: "13px" }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: "2px solid #000", paddingBottom: "12px" }}>
        <div style={{ fontSize: "24px", fontWeight: "bold", letterSpacing: "2px" }}>
          MEDLIVER
        </div>
        <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>НЭХЭМЖЛЭЛ / INVOICE</div>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "2px" }}>Нэхэмжлэлийн дугаар</div>
          <div style={{ fontWeight: "bold", fontFamily: "monospace" }}>{inv.invoiceNumber}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "2px" }}>Огноо</div>
          <div style={{ fontWeight: "bold" }}>{formatDateTimeMn(inv.createdAt)}</div>
        </div>
      </div>

      {/* Patient info */}
      <div style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "12px", marginBottom: "20px", background: "#f9f9f9" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px", fontWeight: "bold", textTransform: "uppercase" }}>
          Өвчтөний мэдээлэл
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          <div>
            <span style={{ color: "#666", fontSize: "11px" }}>Нэр: </span>
            <span style={{ fontWeight: "600" }}>{inv.patientName}</span>
          </div>
          <div>
            <span style={{ color: "#666", fontSize: "11px" }}>Өвчтөний код: </span>
            <span style={{ fontFamily: "monospace" }}>{inv.patientCode}</span>
          </div>
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px" }}>
        <thead>
          <tr style={{ background: "#1e293b", color: "#fff" }}>
            <th style={{ textAlign: "left", padding: "8px 10px", fontSize: "12px", fontWeight: "600" }}>Үйлчилгээ</th>
            <th style={{ textAlign: "center", padding: "8px 10px", fontSize: "12px", fontWeight: "600", width: "60px" }}>Тоо</th>
            <th style={{ textAlign: "right", padding: "8px 10px", fontSize: "12px", fontWeight: "600", width: "120px" }}>Нэгж үнэ</th>
            <th style={{ textAlign: "right", padding: "8px 10px", fontSize: "12px", fontWeight: "600", width: "120px" }}>Дүн</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, idx) => (
            <tr
              key={idx}
              style={{ background: idx % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
            >
              <td style={{ padding: "8px 10px" }}>{it.name}</td>
              <td style={{ padding: "8px 10px", textAlign: "center" }}>{it.quantity}</td>
              <td style={{ padding: "8px 10px", textAlign: "right" }}>{formatMnt(it.unitPrice)}</td>
              <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "500" }}>{formatMnt(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <table style={{ width: "260px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 10px", color: "#666", fontSize: "12px" }}>Дэд дүн</td>
              <td style={{ padding: "4px 10px", textAlign: "right" }}>{formatMnt(inv.subtotal)}</td>
            </tr>
            {inv.discount > 0 && (
              <tr>
                <td style={{ padding: "4px 10px", color: "#666", fontSize: "12px" }}>Хөнгөлөлт</td>
                <td style={{ padding: "4px 10px", textAlign: "right", color: "#e53e3e" }}>−{formatMnt(inv.discount)}</td>
              </tr>
            )}
            <tr style={{ borderTop: "2px solid #000" }}>
              <td style={{ padding: "8px 10px", fontWeight: "bold" }}>Нийт дүн</td>
              <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "bold", fontSize: "15px" }}>{formatMnt(inv.total)}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 10px", color: "#16a34a", fontSize: "12px" }}>Төлсөн</td>
              <td style={{ padding: "4px 10px", textAlign: "right", color: "#16a34a" }}>{formatMnt(inv.paid)}</td>
            </tr>
            <tr style={{ background: inv.balance > 0 ? "#fff7ed" : "#f0fdf4" }}>
              <td style={{ padding: "6px 10px", fontWeight: "600" }}>Үлдэгдэл</td>
              <td style={{
                padding: "6px 10px",
                textAlign: "right",
                fontWeight: "700",
                color: inv.balance > 0 ? "#ea580c" : "#16a34a",
              }}>
                {formatMnt(inv.balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment history */}
      {inv.payments.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "6px", textTransform: "uppercase", color: "#444" }}>
            Төлбөрийн түүх
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", fontSize: "11px", color: "#666", fontWeight: "600" }}>Огноо</th>
                <th style={{ textAlign: "left", padding: "4px 8px", fontSize: "11px", color: "#666", fontWeight: "600" }}>Хэлбэр</th>
                <th style={{ textAlign: "left", padding: "4px 8px", fontSize: "11px", color: "#666", fontWeight: "600" }}>Хүлээн авсан</th>
                <th style={{ textAlign: "right", padding: "4px 8px", fontSize: "11px", color: "#666", fontWeight: "600" }}>Дүн</th>
              </tr>
            </thead>
            <tbody>
              {inv.payments.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "4px 8px", fontSize: "12px" }}>{formatDateTimeMn(p.paidAt)}</td>
                  <td style={{ padding: "4px 8px", fontSize: "12px" }}>{PAYMENT_METHOD_LABELS_MN[p.method]}</td>
                  <td style={{ padding: "4px 8px", fontSize: "12px" }}>{p.receivedBy ?? "—"}</td>
                  <td style={{ padding: "4px 8px", fontSize: "12px", textAlign: "right" }}>{formatMnt(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status stamp */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "32px", borderTop: "1px solid #ddd", paddingTop: "12px" }}>
        <div style={{ fontSize: "11px", color: "#888" }}>
          Хэвлэсэн: {new Date().toLocaleDateString("mn-MN")}
        </div>
        <div style={{
          border: `2px solid ${inv.status === "paid" ? "#16a34a" : inv.status === "cancelled" ? "#dc2626" : "#ea580c"}`,
          color: inv.status === "paid" ? "#16a34a" : inv.status === "cancelled" ? "#dc2626" : "#ea580c",
          padding: "4px 16px",
          borderRadius: "4px",
          fontWeight: "bold",
          fontSize: "13px",
          letterSpacing: "1px",
        }}>
          {INVOICE_STATUS_LABELS_MN[inv.status].toUpperCase()}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
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

  const canPay =
    user &&
    (user.role === "admin" || user.role === "reception") &&
    inv.balance > 0 &&
    inv.status !== "cancelled";
  const canCancel =
    user &&
    (user.role === "admin" || user.role === "manager") &&
    inv.status !== "cancelled" &&
    inv.paid === 0;

  return (
    <>
      {/* ── Print-only invoice (hidden on screen, visible on print) ── */}
      <PrintInvoice inv={inv} />

      {/* ── Screen UI (hidden on print) ─────────────────────────────── */}
      <div className="screen-only space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="no-print">
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
            <Button
              variant="outline"
              size="sm"
              className="no-print"
              onClick={() => window.print()}
            >
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
              <div className="text-xs text-muted-foreground font-mono">{inv.patientCode}</div>
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
                    <td colSpan={3} className="text-right text-muted-foreground">Дэд дүн</td>
                    <td className="text-right">{formatMnt(inv.subtotal)}</td>
                  </tr>
                  {inv.discount > 0 && (
                    <tr>
                      <td colSpan={3} className="text-right text-muted-foreground">Хөнгөлөлт</td>
                      <td className="text-right">−{formatMnt(inv.discount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="text-right font-semibold">Нийт дүн</td>
                    <td className="text-right font-semibold">{formatMnt(inv.total)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right text-emerald-700">Төлсөн</td>
                    <td className="text-right text-emerald-700">{formatMnt(inv.paid)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="text-right font-semibold">Үлдэгдэл</td>
                    <td className="text-right font-semibold">{formatMnt(inv.balance)}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {canPay && (
              <Card className="no-print">
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
            )}

            {canCancel && (
              <Card className="no-print">
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
            )}

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
    </>
  );
}
