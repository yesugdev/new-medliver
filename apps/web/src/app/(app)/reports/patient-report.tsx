"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, Users, Stethoscope, Repeat, Sparkles } from "lucide-react";
import type { ReportRange } from "@his/shared";
import { ROLE_LABELS_MN, type Role } from "@his/shared";
import { getPatientReport } from "@/lib/reports-api";
import { exportExcel, exportCsv, printReport, type ExportSheet } from "@/lib/report-export";
import { PieChart, BarChart, HBarChart, LineChart, CHART_PALETTE } from "@/components/reports/charts";
import {
  KpiCard, ChartCard, ReportTable, ReportSkeleton, ExportButtons, EmptyState, type Column,
} from "@/components/reports/report-ui";

const num = (n: number) => new Intl.NumberFormat("mn-MN").format(n);
const roleLabel = (r: string) => ROLE_LABELS_MN[r as Role] ?? r;

export function PatientReportView({ range }: { range: ReportRange }) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-patient", range.from, range.to],
    queryFn: () => getPatientReport(range),
    enabled: !!range.from && !!range.to,
  });

  if (isLoading) return <ReportSkeleton />;
  if (isError || !data) return <EmptyState text="Тайлан ачаалахад алдаа гарлаа" />;

  const byUserTotal = data.byUser.reduce((s, u) => s + u.count, 0);

  const sheets = (): ExportSheet[] => [
    {
      name: "KPI",
      headers: ["Үзүүлэлт", "Утга"],
      rows: [
        ["Өнөөдөр бүртгэгдсэн", data.kpi.todayRegistered],
        ["Нийт өвчтөн", data.kpi.totalPatients],
        ["Өнөөдрийн эмчилгээ", data.kpi.todayTreatments],
        ["Дахин ирсэн", data.kpi.returningPatients],
        ["Шинээр бүртгэгдсэн", data.kpi.newPatients],
      ],
    },
    {
      name: "Хүйс",
      headers: ["Хүйс", "Тоо"],
      rows: [["Эрэгтэй", data.gender.male], ["Эмэгтэй", data.gender.female], ["Бусад", data.gender.other]],
    },
    { name: "Насны бүлэг", headers: ["Бүлэг", "Тоо"], rows: data.ageGroups.map((a) => [a.label, a.count]) },
    {
      name: "Хэрэглэгчээр",
      headers: ["Хэрэглэгч", "Эрх", "Бүртгэсэн"],
      rows: data.byUser.map((u) => [u.name, roleLabel(u.role), u.count]),
    },
    { name: "Топ эмчилгээ", headers: ["Эм/эмчилгээ", "Тоо"], rows: data.treatment.topTypes.map((t) => [t.name, t.count]) },
    { name: "Өдрийн бүртгэл", headers: ["Огноо", "Тоо"], rows: data.dailyRegistrations.map((d) => [d.date, d.count]) },
  ];

  const userColumns: Column<(typeof data.byUser)[number]>[] = [
    { key: "name", header: "Хэрэглэгч", render: (r) => r.name },
    { key: "role", header: "Эрх", render: (r) => <span className="text-muted-foreground">{roleLabel(r.role)}</span> },
    { key: "count", header: "Бүртгэсэн", align: "right", render: (r) => num(r.count) },
  ];

  const genderData = [
    { label: "Эрэгтэй", value: data.gender.male, color: CHART_PALETTE[10] },
    { label: "Эмэгтэй", value: data.gender.female, color: CHART_PALETTE[6] },
    { label: "Бусад", value: data.gender.other, color: CHART_PALETTE[5] },
  ];

  // Өдрийн ачаалал — бүртгэл ба эмчилгээ хамтад нь
  const dateKeys = [...new Set([
    ...data.dailyRegistrations.map((d) => d.date),
    ...data.treatment.daily.map((d) => d.date),
  ])].sort();
  const regMap = new Map(data.dailyRegistrations.map((d) => [d.date, d.count]));
  const treatMap = new Map(data.treatment.daily.map((d) => [d.date, d.count]));
  const shortDate = (d: string) => d.slice(5);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ExportButtons
          onExcel={() => exportExcel("өвчтөний-тайлан", sheets())}
          onCsv={() => exportCsv("өвчтөний-тайлан", sheets())}
          onPrint={() => printRef.current && printReport(printRef.current, "Өвчтөний тайлан")}
        />
      </div>

      <div ref={printRef} className="space-y-5">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <KpiCard label="Өнөөдөр бүртгэгдсэн" value={num(data.kpi.todayRegistered)} icon={UserPlus} tone="indigo" />
          <KpiCard label="Нийт өвчтөн" value={num(data.kpi.totalPatients)} icon={Users} tone="sky" />
          <KpiCard label="Өнөөдрийн эмчилгээ" value={num(data.kpi.todayTreatments)} icon={Stethoscope} tone="emerald" />
          <KpiCard label="Дахин ирсэн" value={num(data.kpi.returningPatients)} icon={Repeat} tone="amber" />
          <KpiCard label="Шинээр бүртгэгдсэн" value={num(data.kpi.newPatients)} icon={Sparkles} tone="violet" hint="сонгосон хугацаанд" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Хүйсийн харьцаа">
            <PieChart data={genderData} donut />
          </ChartCard>
          <ChartCard title="Насны бүлэг">
            <BarChart data={data.ageGroups.map((a) => ({ label: a.label, value: a.count }))} format={num} />
          </ChartCard>
        </div>

        <ChartCard title="Өдөр бүрийн ачаалал (бүртгэл ба эмчилгээ)">
          <LineChart
            categories={dateKeys.map(shortDate)}
            series={[
              { name: "Бүртгэсэн өвчтөн", color: CHART_PALETTE[0], values: dateKeys.map((d) => regMap.get(d) ?? 0) },
              { name: "Эмчилгээ", color: CHART_PALETTE[1], values: dateKeys.map((d) => treatMap.get(d) ?? 0) },
            ]}
            format={num}
          />
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Хэрэглэгчээр бүртгэсэн өвчтөн">
            <ReportTable
              columns={userColumns}
              rows={data.byUser}
              footer={
                <tr className="border-t border-border font-semibold">
                  <td className="py-2 px-3">Нийт</td>
                  <td />
                  <td className="py-2 px-3 text-right tabular-nums">{num(byUserTotal)}</td>
                </tr>
              }
            />
          </ChartCard>
          <ChartCard title={`Түгээмэл эмчилгээ · нийт ${num(data.treatment.total)}`}>
            {data.treatment.topTypes.length === 0 ? (
              <EmptyState />
            ) : (
              <HBarChart data={data.treatment.topTypes.map((t) => ({ label: t.name, value: t.count }))} format={num} />
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
