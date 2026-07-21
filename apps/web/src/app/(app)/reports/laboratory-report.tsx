"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, CheckCircle2, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import type { ReportRange } from "@his/shared";
import { ROLE_LABELS_MN, type Role } from "@his/shared";
import { getLaboratoryReport } from "@/lib/reports-api";
import { exportExcel, exportCsv, printReport, type ExportSheet } from "@/lib/report-export";
import { PieChart, HBarChart, LineChart, CHART_PALETTE } from "@/components/reports/charts";
import {
  KpiCard, ChartCard, ReportTable, ReportSkeleton, ExportButtons, EmptyState, type Column,
} from "@/components/reports/report-ui";

const num = (n: number) => new Intl.NumberFormat("mn-MN").format(n);
const roleLabel = (r: string) => ROLE_LABELS_MN[r as Role] ?? r;

export function LaboratoryReportView({ range }: { range: ReportRange }) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-laboratory", range.from, range.to],
    queryFn: () => getLaboratoryReport(range),
    enabled: !!range.from && !!range.to,
  });

  if (isLoading) return <ReportSkeleton />;
  if (isError || !data) return <EmptyState text="Тайлан ачаалахад алдаа гарлаа" />;

  const normalTotal = data.normalAbnormal.normal + data.normalAbnormal.abnormal;

  const sheets = (): ExportSheet[] => [
    {
      name: "KPI",
      headers: ["Үзүүлэлт", "Утга"],
      rows: [
        ["Нийт шинжилгээ", data.kpi.totalTests],
        ["Хариу гарсан", data.kpi.resulted],
        ["Хүлээгдэж буй", data.kpi.pending],
        ["Хэвийн", data.kpi.normal],
        ["Хэвийн бус", data.kpi.abnormal],
      ],
    },
    { name: "Төрлөөр", headers: ["Төрөл", "Тоо"], rows: data.byType.map((t) => [t.label, t.count]) },
    {
      name: "Төлөв",
      headers: ["Төлөв", "Тоо"],
      rows: [["Хариу гарсан", data.status.resulted], ["Хүлээгдэж буй", data.status.pending], ["Цуцлагдсан", data.status.cancelled]],
    },
    {
      name: "Хэрэглэгчээр",
      headers: ["Хэрэглэгч", "Эрх", "Шинжилгээ"],
      rows: data.byUser.map((u) => [u.name, roleLabel(u.role), u.count]),
    },
    { name: "Топ шинжилгээ", headers: ["Шинжилгээ", "Тоо"], rows: data.topTests.map((t) => [t.name, t.count]) },
    { name: "Өдрийн ачаалал", headers: ["Огноо", "Тоо"], rows: data.daily.map((d) => [d.date, d.count]) },
  ];

  const userColumns: Column<(typeof data.byUser)[number]>[] = [
    { key: "name", header: "Хэрэглэгч", render: (r) => r.name },
    { key: "role", header: "Эрх", render: (r) => <span className="text-muted-foreground">{roleLabel(r.role)}</span> },
    { key: "count", header: "Шинжилгээ", align: "right", render: (r) => num(r.count) },
  ];
  const topColumns: Column<(typeof data.topTests)[number]>[] = [
    { key: "i", header: "#", render: (_r, i) => i + 1 },
    { key: "name", header: "Шинжилгээ", render: (r) => r.name },
    { key: "count", header: "Тоо", align: "right", render: (r) => num(r.count) },
  ];

  const statusData = [
    { label: "Хариу гарсан", value: data.status.resulted, color: CHART_PALETTE[1] },
    { label: "Хүлээгдэж буй", value: data.status.pending, color: CHART_PALETTE[2] },
    { label: "Цуцлагдсан", value: data.status.cancelled, color: CHART_PALETTE[3] },
  ];
  const normalData = [
    { label: "Хэвийн", value: data.normalAbnormal.normal, color: CHART_PALETTE[1] },
    { label: "Хэвийн бус", value: data.normalAbnormal.abnormal, color: CHART_PALETTE[3] },
  ];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ExportButtons
          onExcel={() => exportExcel("лабораторийн-тайлан", sheets())}
          onCsv={() => exportCsv("лабораторийн-тайлан", sheets())}
          onPrint={() => printRef.current && printReport(printRef.current, "Лабораторийн тайлан")}
        />
      </div>

      <div ref={printRef} className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <KpiCard label="Нийт шинжилгээ" value={num(data.kpi.totalTests)} icon={FlaskConical} tone="indigo" />
          <KpiCard label="Хариу гарсан" value={num(data.kpi.resulted)} icon={CheckCircle2} tone="emerald" />
          <KpiCard label="Хүлээгдэж буй" value={num(data.kpi.pending)} icon={Clock} tone="amber" />
          <KpiCard label="Хэвийн" value={num(data.kpi.normal)} icon={ShieldCheck} tone="sky" />
          <KpiCard label="Хэвийн бус" value={num(data.kpi.abnormal)} icon={AlertTriangle} tone="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Хариуны төлөв">
            <PieChart data={statusData} donut />
          </ChartCard>
          <ChartCard title={`Хэвийн / Хэвийн бус${normalTotal > 0 ? ` · ${num(normalTotal)}` : ""}`}>
            <PieChart data={normalData} />
          </ChartCard>
        </div>

        <ChartCard title="Шинжилгээний төрлөөр">
          {data.byType.length === 0 ? <EmptyState /> : (
            <HBarChart data={data.byType.map((t) => ({ label: t.label, value: t.count }))} format={num} />
          )}
        </ChartCard>

        <ChartCard title="Өдөр бүрийн лабораторийн ачаалал">
          <LineChart
            categories={data.daily.map((d) => d.date.slice(5))}
            series={[{ name: "Шинжилгээ", color: CHART_PALETTE[4], values: data.daily.map((d) => d.count) }]}
            area
            format={num}
          />
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Хэрэглэгчээр бүртгэсэн шинжилгээ">
            <ReportTable columns={userColumns} rows={data.byUser} />
          </ChartCard>
          <ChartCard title="Top 10 шинжилгээ">
            <ReportTable columns={topColumns} rows={data.topTests} pageSize={10} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
