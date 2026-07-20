"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Printer, Trash2 } from "lucide-react";
import {
  INVOICE_STATUS_LABELS_MN,
  PAYMENT_METHOD_LABELS_MN,
  type PaymentMethod,
  type PrintConfig,
} from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { getInvoice, recordPayment, cancelInvoice, deleteInvoice, setInvoiceVat } from "@/lib/billing-api";
import { getHospitalConfig } from "@/lib/hospital-config-api";
import { getPatient } from "@/lib/patients-api";
import { getPrintConfig } from "@/lib/print-config-api";
import { openPrintWindow, buildPatientMeta, cfg, type PrintPatientInfo } from "@/lib/print-utils";
import { printThermalInvoice, THERMAL_WIDTH_LABELS, type ThermalWidthKey } from "@/lib/thermal-print";
import { INVOICE_TONE } from "@/lib/status-tones";
import { formatMnt } from "@/lib/format";
import { formatDateTimeMn } from "@/lib/utils";
import { extractApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { Invoice } from "@his/shared";

const METHODS: PaymentMethod[] = ["cash", "card", "transfer", "insurance"];

/* ─── Print function ─────────────────────────────────────────────── */
function printInvoice(
  inv: Invoice,
  config?: Partial<PrintConfig>,
  patient?: PrintPatientInfo,
) {
  const rows = inv.items.map((it, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#fff" : "#f8fafc"};border-bottom:1px solid #e2e8f0">
      <td style="padding:8px 12px">${it.name}</td>
      <td style="padding:8px 12px;text-align:center">${it.quantity}</td>
      <td style="padding:8px 12px;text-align:right">${formatMnt(it.unitPrice)}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:600">${formatMnt(it.total)}</td>
    </tr>
  `).join("");

  const payHistRows = inv.payments.map((p, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#fff" : "#f8fafc"};border-bottom:1px solid #f0f0f0">
      <td style="padding:5px 10px;font-size:12px">${formatDateTimeMn(p.paidAt)}</td>
      <td style="padding:5px 10px;font-size:12px">${PAYMENT_METHOD_LABELS_MN[p.method]}</td>
      <td style="padding:5px 10px;font-size:12px">${p.receivedBy ?? "—"}</td>
      <td style="padding:5px 10px;font-size:12px;text-align:right">${formatMnt(p.amount)}</td>
    </tr>
  `).join("");

  const statusColor = inv.status === "paid" ? "#16a34a" : inv.status === "cancelled" ? "#dc2626" : "#ea580c";

  const c = cfg(config);
  const patientBlock = patient
    ? buildPatientMeta(patient, c)
    : `<div class="p-meta">
        <div class="p-meta-block"><span>Өвчтөн</span><strong>${inv.patientName}</strong></div>
        <div class="p-meta-block"><span>Код</span><strong style="font-family:monospace">${inv.patientCode}</strong></div>
       </div>`;

  openPrintWindow("Нэхэмжлэл", "НЭХЭМЖЛЭЛ / INVOICE", `
    ${patientBlock}
    <div class="p-meta" style="margin-bottom:12px">
      <div class="p-meta-block"><span>Нэхэмжлэлийн дугаар</span><strong style="font-family:monospace">${inv.invoiceNumber}</strong></div>
      <div class="p-meta-block" style="text-align:right"><span>Огноо</span><strong>${formatDateTimeMn(inv.createdAt)}</strong></div>
    </div>

    <table style="margin-bottom:16px">
      <thead><tr><th>Үйлчилгээ</th><th style="width:60px;text-align:center">Тоо</th><th style="width:120px;text-align:right">Нэгж үнэ</th><th style="width:120px;text-align:right">Дүн</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <table style="width:260px;border-collapse:collapse">
        <tbody>
          <tr><td style="padding:4px 10px;color:#64748b;font-size:12px">Дэд дүн</td><td style="padding:4px 10px;text-align:right">${formatMnt(inv.subtotal)}</td></tr>
          ${inv.discount > 0 ? `<tr><td style="padding:4px 10px;color:#64748b;font-size:12px">Хөнгөлөлт</td><td style="padding:4px 10px;text-align:right;color:#e53e3e">−${formatMnt(inv.discount)}</td></tr>` : ""}
          ${inv.vat > 0 ? `<tr><td style="padding:4px 10px;color:#64748b;font-size:12px">НӨАТ (${inv.vatRate}%)</td><td style="padding:4px 10px;text-align:right">${formatMnt(inv.vat)}</td></tr>` : ""}
          <tr style="border-top:2px solid #000"><td style="padding:8px 10px;font-weight:700">Нийт дүн</td><td style="padding:8px 10px;text-align:right;font-weight:700;font-size:15px">${formatMnt(inv.total)}</td></tr>
          <tr><td style="padding:4px 10px;color:#16a34a;font-size:12px">Төлсөн</td><td style="padding:4px 10px;text-align:right;color:#16a34a">${formatMnt(inv.paid)}</td></tr>
          <tr style="background:${inv.balance > 0 ? "#fff7ed" : "#f0fdf4"}">
            <td style="padding:6px 10px;font-weight:600">Үлдэгдэл</td>
            <td style="padding:6px 10px;text-align:right;font-weight:700;color:${inv.balance > 0 ? "#ea580c" : "#16a34a"}">${formatMnt(inv.balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${inv.payments.length > 0 ? `
    <div style="margin-bottom:20px">
      <div style="font-weight:700;font-size:12px;margin-bottom:6px;text-transform:uppercase;color:#475569">Төлбөрийн түүх</div>
      <table>
        <thead><tr>
          <th style="font-size:11px">Огноо</th><th style="font-size:11px">Хэлбэр</th>
          <th style="font-size:11px">Хүлээн авсан</th><th style="font-size:11px;text-align:right">Дүн</th>
        </tr></thead>
        <tbody>${payHistRows}</tbody>
      </table>
    </div>` : ""}

    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <span style="border:2px solid ${statusColor};color:${statusColor};padding:4px 16px;border-radius:4px;font-weight:700;font-size:13px;letter-spacing:1px">
        ${INVOICE_STATUS_LABELS_MN[inv.status].toUpperCase()}
      </span>
    </div>
  `, config);
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [receiptWidth, setReceiptWidth] = useState<ThermalWidthKey>("80");

  const { data: inv, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice(id),
  });

  const { data: printConfig } = useQuery({
    queryKey: ["print-config"],
    queryFn: getPrintConfig,
    staleTime: 5 * 60_000,
  });

  const { data: patientData } = useQuery({
    queryKey: ["patient", inv?.patientId],
    queryFn: () => getPatient(inv!.patientId),
    enabled: !!inv?.patientId,
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (printConfig?.receiptWidth) setReceiptWidth(printConfig.receiptWidth);
  }, [printConfig?.receiptWidth]);

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

  const deleteMut = useMutation({
    mutationFn: () => deleteInvoice(id),
    onSuccess: () => {
      toast({ title: "Нэхэмжлэл устгагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      router.replace("/billing");
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const { data: hospitalConfig } = useQuery({
    queryKey: ["hospital-config"],
    queryFn: getHospitalConfig,
    staleTime: 5 * 60_000,
  });

  const vatMut = useMutation({
    mutationFn: (rate: number) => setInvoiceVat(id, rate),
    onSuccess: () => {
      toast({ title: "НӨАТ шинэчлэгдлээ", variant: "success" });
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  if (isLoading || !inv) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canPay =
    user && (user.role === "admin" || user.role === "reception") &&
    inv.balance > 0 && inv.status !== "cancelled";
  const canCancel =
    user && ["admin", "manager", "reception"].includes(user.role) &&
    inv.status !== "cancelled" && inv.paid === 0;
  const canDelete = user?.role === "admin";
  const canEditVat =
    user && ["admin", "manager", "reception"].includes(user.role) &&
    inv.status !== "cancelled" && inv.paid === 0;
  const defaultVatRate = inv.vatRate > 0 ? inv.vatRate : (hospitalConfig?.vatRate ?? 10);
  const patientPrintInfo: PrintPatientInfo | undefined = patientData ? {
    name: `${patientData.lastName} ${patientData.firstName}`,
    patientCode: patientData.patientCode,
    registerNumber: patientData.registerNumber,
    birthDate: patientData.birthDate,
    gender: patientData.gender,
    phone: patientData.phone,
    address: patientData.address,
    bloodType: patientData.bloodType,
    attendingDoctorName: patientData.attendingDoctorName,
  } : undefined;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="text-xs text-muted-foreground font-mono">{inv.invoiceNumber}</div>
            <h1 className="text-2xl font-semibold tracking-tight">Нэхэмжлэл</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge tone={INVOICE_TONE[inv.status]}>{INVOICE_STATUS_LABELS_MN[inv.status]}</Badge>
          <Button variant="outline" size="sm" onClick={() => printInvoice(inv, printConfig, patientPrintInfo)}>
            <Printer className="h-4 w-4" />
            Хэвлэх (А4)
          </Button>
          <div className="flex items-center gap-1">
            <Select value={receiptWidth} onValueChange={(v) => setReceiptWidth(v as ThermalWidthKey)}>
              <SelectTrigger className="h-9 w-[92px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(THERMAL_WIDTH_LABELS) as ThermalWidthKey[]).map((w) => (
                  <SelectItem key={w} value={w}>{THERMAL_WIDTH_LABELS[w]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline" size="sm"
              onClick={() => printThermalInvoice(inv, printConfig, patientPrintInfo, receiptWidth)}
            >
              <Printer className="h-4 w-4" />
              Тасалбар
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <Link href={`/patients/${inv.patientId}`} className="hover:underline">{inv.patientName}</Link>
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
                <tr><td colSpan={3} className="text-right text-muted-foreground">Дэд дүн</td><td className="text-right">{formatMnt(inv.subtotal)}</td></tr>
                {inv.discount > 0 && <tr><td colSpan={3} className="text-right text-muted-foreground">Хөнгөлөлт</td><td className="text-right">−{formatMnt(inv.discount)}</td></tr>}
                {inv.vat > 0 && <tr><td colSpan={3} className="text-right text-muted-foreground">НӨАТ ({inv.vatRate}%)</td><td className="text-right">{formatMnt(inv.vat)}</td></tr>}
                <tr><td colSpan={3} className="text-right font-semibold">Нийт дүн</td><td className="text-right font-semibold">{formatMnt(inv.total)}</td></tr>
                <tr><td colSpan={3} className="text-right text-emerald-700">Төлсөн</td><td className="text-right text-emerald-700">{formatMnt(inv.paid)}</td></tr>
                <tr><td colSpan={3} className="text-right font-semibold">Үлдэгдэл</td><td className="text-right font-semibold">{formatMnt(inv.balance)}</td></tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {canPay && (
            <Card>
              <CardHeader><CardTitle>Төлбөр бүртгэх</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Дүн</Label>
                  <Input type="number" min={0} max={inv.balance} value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">Үлдэгдэл: {formatMnt(inv.balance)}</p>
                </div>
                <div className="space-y-1">
                  <Label>Хэлбэр</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS_MN[m]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={() => payMut.mutate()} disabled={!amount || amount > inv.balance || payMut.isPending}>Бүртгэх</Button>
              </CardContent>
            </Card>
          )}
          {canEditVat && (
            <Card><CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inv.vat > 0}
                    disabled={vatMut.isPending}
                    onChange={(e) => vatMut.mutate(e.target.checked ? defaultVatRate : 0)}
                    className="h-4 w-4 accent-primary rounded"
                  />
                  НӨАТ ({defaultVatRate}%) бодох
                </label>
                {vatMut.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <p className="text-xs text-muted-foreground">Зөвхөн төлбөр төлөгдөөгүй үед өөрчилж болно.</p>
            </CardContent></Card>
          )}
          {(canCancel || canDelete) && (
            <Card><CardContent className="p-4 space-y-2">
              {canCancel && (
                <Button variant="outline" className="w-full" size="sm" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
                  Нэхэмжлэл цуцлах
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive" className="w-full" size="sm"
                  onClick={() => { if (confirm("Энэ нэхэмжлэлийг бүрмөсөн устгах уу?")) deleteMut.mutate(); }}
                  disabled={deleteMut.isPending}
                >
                  {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Бүрмөсөн устгах
                </Button>
              )}
            </CardContent></Card>
          )}
          <Card>
            <CardHeader><CardTitle>Төлбөрийн түүх</CardTitle></CardHeader>
            <CardContent>
              {inv.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">Төлбөр бүртгээгүй</p>
              ) : (
                <ul className="space-y-2">
                  {inv.payments.map((p, idx) => (
                    <li key={idx} className="text-sm border-l-2 border-primary/40 pl-3">
                      <div className="font-medium">{formatMnt(p.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABELS_MN[p.method]} · {formatDateTimeMn(p.paidAt)}
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
