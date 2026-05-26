"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { SERVICE_CATEGORY_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { listPatients } from "@/lib/patients-api";
import { listServices, createInvoice } from "@/lib/billing-api";
import { formatMnt } from "@/lib/format";
import { extractApiError } from "@/lib/api";

interface LineItem {
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);

  const patients = useQuery({
    queryKey: ["patient-search", search],
    queryFn: () => listPatients({ search: search || undefined, pageSize: 8 }),
    enabled: search.length > 0,
  });

  const services = useQuery({
    queryKey: ["services", true],
    queryFn: () => listServices(true),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createInvoice({
        patientId,
        items: items.map((i) => ({
          serviceId: i.serviceId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discount,
      }),
    onSuccess: (inv) => {
      toast({ title: "Нэхэмжлэл үүсгэлээ", description: inv.invoiceNumber, variant: "success" });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      router.replace(`/billing/${inv.id}`);
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const addService = (id: string) => {
    const svc = services.data?.find((s) => s.id === id);
    if (!svc) return;
    setItems([
      ...items,
      { serviceId: svc.id, name: svc.name, quantity: 1, unitPrice: svc.price },
    ]);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);
  const canSubmit = patientId && items.length > 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Шинэ нэхэмжлэл</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Өвчтөн</CardTitle>
        </CardHeader>
        <CardContent>
          {patientId ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-md border bg-muted/30 text-sm">
                {patientName}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setPatientId(""); setPatientName(""); }}>
                Солих
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Нэр, регистр, утсаар хайх..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {patients.data && patients.data.items.length > 0 ? (
                <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                  {patients.data.items.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => {
                        setPatientId(p.id);
                        setPatientName(`${p.lastName} ${p.firstName} · ${p.patientCode}`);
                      }}
                    >
                      <div className="font-medium">
                        {p.lastName} {p.firstName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {p.patientCode} · {p.phone}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Үйлчилгээ</CardTitle>
          <div className="flex gap-2">
            <select
              className="h-9 rounded-md border px-2 text-sm bg-background"
              onChange={(e) => {
                if (e.target.value) {
                  addService(e.target.value);
                  e.target.value = "";
                }
              }}
            >
              <option value="">Үйлчилгээ нэмэх...</option>
              {services.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({SERVICE_CATEGORY_LABELS_MN[s.category]}) — {formatMnt(s.price)}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setItems([...items, { name: "", quantity: 1, unitPrice: 0 }])
              }
            >
              <Plus className="h-4 w-4" />
              Гараар
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Үйлчилгээ нэмээгүй
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Үйлчилгээ</th>
                  <th className="w-24">Тоо</th>
                  <th className="w-32 text-right">Үнэ</th>
                  <th className="w-32 text-right">Дүн</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>
                      <Input
                        value={it.name}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setItems(next);
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], quantity: parseFloat(e.target.value) || 1 };
                          setItems(next);
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        min={0}
                        value={it.unitPrice}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], unitPrice: parseFloat(e.target.value) || 0 };
                          setItems(next);
                        }}
                        className="text-right"
                      />
                    </td>
                    <td className="text-right font-medium">
                      {formatMnt(it.quantity * it.unitPrice)}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Дэд дүн</span>
            <span className="font-medium">{formatMnt(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm gap-3">
            <Label>Хөнгөлөлт</Label>
            <Input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-40 text-right"
            />
          </div>
          <div className="flex items-center justify-between text-base font-semibold pt-3 border-t">
            <span>Нийт</span>
            <span>{formatMnt(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Үүсгэж байна...
            </>
          ) : (
            "Нэхэмжлэл үүсгэх"
          )}
        </Button>
      </div>
    </div>
  );
}
