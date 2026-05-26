"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CalendarClock,
  Activity,
  Receipt,
  ListOrdered,
  UserPlus,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { ROLE_LABELS_MN } from "@his/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { getDashboardStats } from "@/lib/stats-api";
import { formatMnt } from "@/lib/format";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
  });

  if (!user) return null;

  const stats = [
    {
      label: "Нийт өвчтөн",
      value: data?.totalPatients ?? "—",
      icon: Users,
      tone: "text-sky-600 bg-sky-50",
    },
    {
      label: "Өнөөдрийн цаг",
      value: data?.todayAppointments ?? "—",
      icon: CalendarClock,
      tone: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Хүлээж буй",
      value: data?.waitingPatients ?? "—",
      icon: ListOrdered,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Өнөөдрийн үзлэг",
      value: data?.todayVisits ?? "—",
      icon: Activity,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Өнөөдрийн орлого",
      value: data ? formatMnt(data.todayRevenue) : "—",
      icon: Receipt,
      tone: "text-rose-600 bg-rose-50",
    },
    {
      label: "7 хоногт шинэ өвчтөн",
      value: data?.newPatientsThisWeek ?? "—",
      icon: UserPlus,
      tone: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Хяналтын самбар</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Сайн байна уу, {user.fullName} · {ROLE_LABELS_MN[user.role]}
          </p>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            30 секунд тутамд шинэчлэгдэнэ
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center ${s.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-semibold">{s.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Хурдан үйлдэл</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(user.role === "admin" || user.role === "reception") && (
              <QuickAction href="/patients/new" label="Шинэ өвчтөн" icon={Users} />
            )}
            {(user.role === "admin" || user.role === "reception") && (
              <QuickAction href="/appointments/new" label="Цаг захиалах" icon={CalendarClock} />
            )}
            {(user.role === "doctor" || user.role === "nurse" || user.role === "admin") && (
              <QuickAction href="/queue" label="Дараалал" icon={ListOrdered} />
            )}
            {(user.role === "admin" || user.role === "reception") && (
              <QuickAction href="/billing/new" label="Нэхэмжлэл" icon={Receipt} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
      <Link href={href}>
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
