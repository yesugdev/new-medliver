"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, CalendarDays, TrendingUp, Receipt, Coins, Percent } from "lucide-react";
import type { ReportRange, PaymentMethod, ServiceCategory } from "@his/shared";
import {
  ROLE_LABELS_MN, PAYMENT_METHOD_LABELS_MN, SERVICE_CATEGORY_LABELS_MN, type Role,
} from "@his/shared";
import { getFinancialReport } from "@/lib/reports-api";
import { exportExcel, exportCsv, printReport, type ExportSheet } from "@/lib/report-export";
import { PieChart, BarChart, LineChart, CHART_PALETTE } from "@/components/reports/charts";
import {
  KpiCard, ChartCard, ReportTable, ReportSkeleton, ExportButtons, EmptyState, type Column,
} from "@/components/reports/report-ui";
import { formatMnt } from "@/lib/format";

const num = (n: number) => new Intl.NumberFormat("mn-MN").format(n);
const roleLabel = (r: string) => ROLE_LABELS_MN[r as Role] ?? r;
const methodLabel = (m: string) => PAYMENT_METHOD_LABELS_MN[m as PaymentMethod] ?? m;
const serviceLabel = (c: string) => SERVICE_CATEGORY_LABELS_MN[c as ServiceCategory] ?? c;
const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}к` : String(n));

export function FinancialReportView({ range }: { range: ReportRange }) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-financial", range.from, range.to],
    queryFn: () => getFinancialReport(range),
    enabled: !!range.from && !!range.to,
  });

  if (isLoading) return <ReportSkeleton />;
  if (isError || !data) return <EmptyState text="Тайлан ачаалахад алдаа гарлаа" />;

  const methodTotal = data.byMethod.reduce((s, m) => s + m.amount, 0);

  const sheets = (): ExportSheet[] => [
    {
      name: "KPI",
      headers: ["Үзүүлэлт", "Утга"],
      rows: [
        ["Өнөөдрийн орлого", data.kpi.todayRevenue],
        ["Сарын орлого", data.kpi.monthRevenue],
        ["Жилийн орлого", data.kpi.yearRevenue],
        ["Хугацааны орлого", data.kpi.rangeRevenue],
        ["Төлбөрийн тоо", data.kpi.paymentsCount],
        ["Дундаж төлбөр", data.kpi.avgPayment],
      ],
    },
    {
      name: "Төлбөрийн арга",
      headers: ["Арга", "Тоо", "Дүн"],
      rows: data.byMethod.map((m) => [methodLabel(m.method), m.count, m.amount]),
    },
    { name: "Өдрийн орлого", headers: ["Огноо", "Орлого", "Төлбөрийн тоо"], rows: data.dailyRevenue.map((d) => [d.date, d.amount, d.count]) },
    { name: "Сарын тренд", headers: ["Сар", "Орлого"], rows: data.monthlyTrend.map((m) => [m.month, m.amount]) },
    {
      name: "Үйлчилгээгээр",
      headers: ["Үйлчилгээ", "Тоо", "Орлого"],
      rows: data.byService.map((s) => [serviceLabel(s.category), s.count, s.amount]),
    },
    { name: "Хэрэглэгчээр", headers: ["Хэрэглэгч", "Эрх", "Орлого"], rows: data.byUser.map((u) => [u.name, roleLabel(u.role), u.amount]) },
  ];

  const methodData = data.byMethod.map((m, i) => ({
    label: methodLabel(m.method),
    value: m.amount,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  const dailyColumns: Column<(typeof data.dailyRevenue)[number]>[] = [
    { key: "date", header: "Огноо", render: (r) => r.date },
    { key: "amount", header: "Орлого", align: "right", render: (r) => formatMnt(r.amount) },
    { key: "count", header: "Төлбөрийн тоо", align: "right", render: (r) => num(r.count) },
  ];
  const serviceColumns: Column<(typeof data.byService)[number]>[] = [
    { key: "cat", header: "Үйлчилгээ", render: (r) => serviceLabel(r.category) },
    { key: "count", header: "Тоо", align: "right", render: (r) => num(r.count) },
    { key: "amount", header: "Орлого", align: "right", render: (r) => formatMnt(r.amount) },
  ];
  const userColumns: Column<(typeof data.byUser)[number]>[] = [
    { key: "name", header: "Хэрэглэгч", render: (r) => r.name },
    { key: "role", header: "Эрх", render: (r) => <span className="text-muted-foreground">{roleLabel(r.role)}</span> },
    { key: "amount", header: "Орлого", align: "right", render: (r) => formatMnt(r.amount) },
  ];
  const methodColumns: Column<(typeof data.byMethod)[number]>[] = [
    { key: "m", header: "Арга", render: (r) => methodLabel(r.method) },
    { key: "count", header: "Тоо", align: "right", render: (r) => num(r.count) },
    { key: "amount", header: "Дүн", align: "right", render: (r) => formatMnt(r.amount) },
    {
      key: "pct", header: "%", align: "right",
      render: (r) => `${methodTotal > 0 ? ((r.amount / methodTotal) * 100).toFixed(1) : "0"}%`,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ExportButtons
          onExcel={() => exportExcel("санхүүгийн-тайлан", sheets())}
          onCsv={() => exportCsv("санхүүгийн-тайлан", sheets())}
          onPrint={() => printRef.current && printReport(printRef.current, "Санхүүгийн тайлан")}
        />
      </div>

      <div ref={printRef} className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard label="Өнөөдрийн орлого" value={formatMnt(data.kpi.todayRevenue)} icon={Wallet} tone="emerald" />
          <KpiCard label="Сарын орлого" value={formatMnt(data.kpi.monthRevenue)} icon={CalendarDays} tone="indigo" />
          <KpiCard label="Жилийн орлого" value={formatMnt(data.kpi.yearRevenue)} icon={TrendingUp} tone="sky" />
          <KpiCard label="Төлбөрийн тоо" value={num(data.kpi.paymentsCount)} icon={Receipt} tone="violet" hint="сонгосон хугацаанд" />
          <KpiCard label="Дундаж төлбөр" value={formatMnt(data.kpi.avgPayment)} icon={Coins} tone="amber" />
          <KpiCard label="Хугацааны орлого" value={formatMnt(data.kpi.rangeRevenue)} icon={Wallet} tone="rose" />
        </div>

        {/* Хөнгөлөлт */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <KpiCard label="Нийт хөнгөлөлт" value={formatMnt(data.discount.total)} icon={Percent} tone="rose" />
          <KpiCard label="Хөнгөлөлт авсан өвчтөн" value={num(data.discount.patients)} icon={Percent} tone="amber" />
          <KpiCard label="Дундаж хөнгөлөлт" value={formatMnt(data.discount.avg)} icon={Percent} tone="violet" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Төлбөрийн аргаар">
            <PieChart data={methodData} donut />
          </ChartCard>
          <ChartCard title="Төлбөрийн арга — дэлгэрэнгүй">
            <ReportTable columns={methodColumns} rows={data.byMethod} pageSize={6} />
          </ChartCard>
        </div>

        <ChartCard title="Өдөр бүрийн орлого">
          <BarChart data={data.dailyRevenue.map((d) => ({ label: d.date.slice(5), value: d.amount }))} format={compact} />
        </ChartCard>

        <ChartCard title="Орлогын сарын өсөлт (сүүлийн 12 сар)">
          <LineChart
            categories={data.monthlyTrend.map((m) => m.month.slice(2))}
            series={[{ name: "Орлого", color: CHART_PALETTE[1], values: data.monthlyTrend.map((m) => m.amount) }]}
            area
            format={compact}
          />
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Үйлчилгээ тус бүрийн орлого">
            <ReportTable columns={serviceColumns} rows={data.byService} />
          </ChartCard>
          <ChartCard title="Хэрэглэгчээр орлого">
            <ReportTable columns={userColumns} rows={data.byUser} />
          </ChartCard>
        </div>

        <ChartCard title="Өдөр бүрийн орлогын дэлгэрэнгүй">
          <ReportTable columns={dailyColumns} rows={[...data.dailyRevenue].reverse()} pageSize={12} />
        </ChartCard>
      </div>
    </div>
  );
}
