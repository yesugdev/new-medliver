"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, BarChart3, Loader2, Wallet, AlertTriangle, CalendarClock, CalendarX2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDrugReports } from "@/lib/drugs-api";

const fmt = (n: number) => n.toLocaleString("mn-MN");
const dateStr = (iso: string) => new Date(iso).toLocaleDateString("mn-MN");

export default function DrugReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["drug-reports"], queryFn: getDrugReports });

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/drugs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Эм бүртгэл рүү буцах
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />Эмийн тайлан
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Нөөцийн үнэлгээ, доод хэмжээ, дуусах хугацаа</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" />Нөөцийн үнэлгээ</div>
          <div className="text-xl font-bold mt-1">{fmt(data.totalValuation)}₮</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="text-xs text-muted-foreground">Идэвхтэй эм</div>
          <div className="text-xl font-bold mt-1">{data.totalDrugs}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Удахгүй дуусах</div>
          <div className="text-xl font-bold mt-1 text-amber-600">{data.expiringSoon.length}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarX2 className="h-3.5 w-3.5" />Хугацаа дууссан</div>
          <div className="text-xl font-bold mt-1 text-rose-600">{data.expired.length}</div>
        </CardContent></Card>
      </div>

      {/* Low stock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-amber-600" />Доод хэмжээнд хүрсэн ({data.lowStock.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.lowStock.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Бүх эмийн нөөц хангалттай.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-2.5 font-medium">Эм</th>
                  <th className="text-right px-4 py-2.5 font-medium">Нөөц</th>
                  <th className="text-right px-4 py-2.5 font-medium">Доод хэмжээ</th>
                  <th className="text-right px-4 py-2.5 font-medium">Үнэлгээ</th>
                </tr></thead>
                <tbody>
                  {data.lowStock.map((r) => (
                    <tr key={r.drugId} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5">
                        <Link href={`/drugs/${r.drugId}`} className="text-primary hover:underline">{r.name}</Link>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-amber-600">{r.stock} {r.unit}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{r.minStock}</td>
                      <td className="px-4 py-2.5 text-right">{fmt(r.valuation)}₮</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired */}
      {data.expired.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><CalendarX2 className="h-4 w-4 text-rose-600" />Хугацаа дууссан цуврал ({data.expired.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ExpiryTable rows={data.expired} tone="destructive" />
          </CardContent>
        </Card>
      )}

      {/* Expiring soon */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4 text-amber-600" />Удахгүй дуусах цуврал ({data.expiringSoon.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.expiringSoon.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">30 хоногт дуусах цуврал алга.</div>
          ) : <ExpiryTable rows={data.expiringSoon} tone="warning" />}
        </CardContent>
      </Card>
    </div>
  );
}

function ExpiryTable({ rows, tone }: { rows: import("@his/shared").DrugBatch[]; tone: "warning" | "destructive" }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
          <th className="text-left px-4 py-2.5 font-medium">Цуврал</th>
          <th className="text-left px-4 py-2.5 font-medium">Дуусах хугацаа</th>
          <th className="text-right px-4 py-2.5 font-medium">Үлдэгдэл</th>
        </tr></thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5">
                <Link href={`/drugs/${b.drugId}`} className="text-primary hover:underline">{b.batchNumber}</Link>
              </td>
              <td className="px-4 py-2.5"><Badge tone={tone}>{dateStr(b.expiryDate)}</Badge></td>
              <td className="px-4 py-2.5 text-right font-semibold">{b.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
