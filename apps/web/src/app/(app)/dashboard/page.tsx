"use client";

import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
  Search,
  Settings,
  ShieldCheck,
  Wallet,
  ClipboardCheck,
  Pill,
  AlertTriangle,
  CalendarX2,
} from "lucide-react";
import { ROLE_LABELS_MN } from "@his/shared";
import type { Role } from "@his/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import type { DashboardStats } from "@his/shared";
import { getDashboardStats } from "@/lib/stats-api";
import { listMyPatients } from "@/lib/patients-api";
import { formatMnt } from "@/lib/format";
import { calculateAge, formatDateMn } from "@/lib/utils";

const PAGE_SIZE = 10;

/* ─── Role stat definitions ─────────────────────────────────────────── */
type StatKey = "totalPatients" | "todayAppointments" | "waitingPatients" | "todayVisits" | "todayRevenue" | "newPatientsThisWeek" | "totalRevenue" | "todayTreatments" | "drugValuation" | "drugLowStock" | "drugExpiring";

interface StatDef {
  key: StatKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  format?: "mnt";
}

const ALL_STATS: StatDef[] = [
  { key: "totalPatients",       label: "Нийт өвчтөн",         icon: Users,        tone: "text-sky-600 bg-sky-50" },
  { key: "todayAppointments",   label: "Өнөөдрийн цаг",        icon: CalendarClock, tone: "text-indigo-600 bg-indigo-50" },
  { key: "waitingPatients",     label: "Хүлээж буй",           icon: ListOrdered,  tone: "text-amber-600 bg-amber-50" },
  { key: "todayVisits",         label: "Өнөөдрийн үзлэг",      icon: Activity,     tone: "text-emerald-600 bg-emerald-50" },
  { key: "todayRevenue",        label: "Өнөөдрийн орлого",     icon: Receipt,      tone: "text-rose-600 bg-rose-50",   format: "mnt" },
  { key: "newPatientsThisWeek", label: "7 хоногт шинэ өвчтөн", icon: UserPlus,     tone: "text-purple-600 bg-purple-50" },
  { key: "totalRevenue",        label: "Нийт орлого",          icon: Wallet,       tone: "text-green-600 bg-green-50", format: "mnt" },
  { key: "todayTreatments",     label: "Өнөөдөр хийх эмчилгээ", icon: ClipboardCheck, tone: "text-teal-600 bg-teal-50" },
  { key: "drugValuation",       label: "Эмийн нөөц (үнэлгээ)",  icon: Pill,         tone: "text-cyan-600 bg-cyan-50", format: "mnt" },
  { key: "drugLowStock",        label: "Дуусаж буй эм",        icon: AlertTriangle, tone: "text-amber-600 bg-amber-50" },
  { key: "drugExpiring",        label: "Хугацаа дуусах цуврал", icon: CalendarX2,   tone: "text-rose-600 bg-rose-50" },
];

const ROLE_STATS: Record<Role, StatKey[]> = {
  admin:     ["todayRevenue", "totalRevenue", "totalPatients", "todayVisits", "drugValuation", "drugLowStock", "drugExpiring", "newPatientsThisWeek"],
  manager:   ["totalPatients", "todayAppointments", "waitingPatients", "todayVisits", "todayRevenue", "totalRevenue", "drugValuation", "newPatientsThisWeek"],
  reception: ["totalPatients", "todayAppointments", "waitingPatients", "todayRevenue"],
  doctor:    ["todayTreatments", "todayAppointments", "waitingPatients", "todayVisits"],
  nurse:     ["todayTreatments", "waitingPatients", "todayVisits", "totalPatients"],
};

/* ─── Role quick-action definitions ────────────────────────────────── */
interface ActionDef {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const QUICK_ACTIONS: ActionDef[] = [
  { href: "/patients/new",   label: "Шинэ өвчтөн",  icon: Users,        roles: ["admin", "reception"] },
  { href: "/appointments/new", label: "Цаг захиалах", icon: CalendarClock, roles: ["admin", "reception"] },
  { href: "/queue",          label: "Дараалал",       icon: ListOrdered,  roles: ["admin", "doctor", "nurse"] },
  { href: "/billing/new",    label: "Нэхэмжлэл",     icon: Receipt,      roles: ["admin", "reception"] },
  { href: "/patients",       label: "Өвчтөнгүүд",    icon: Users,        roles: ["nurse"] },
  { href: "/settings",       label: "Тохиргоо",      icon: Settings,     roles: ["admin"] },
  { href: "/users",          label: "Хэрэглэгчид",   icon: ShieldCheck,  roles: ["admin"] },
];

/* ─── My patients panel (doctor only) ──────────────────────────────── */
function MyPatientsPanel() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [inputVal, setInputVal] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-patients", page, search],
    queryFn:  () => listMyPatients({ page, pageSize: PAGE_SIZE, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(inputVal);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Миний өвчтөнгүүд</CardTitle>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Хайх..."
                className="pl-8 h-8 text-sm w-48"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-8">Хайх</Button>
          </form>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            {search ? "Хайлтад тохирох өвчтөн олдсонгүй" : "Танд харьяалагдах өвчтөн байхгүй байна"}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Код</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Нэр</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Нас / Хүйс</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Утас</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Бүртгэсэн</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p, i) => {
                    const age = calculateAge(p.birthDate);
                    const genderLabel = p.gender === "male" ? "Эр" : p.gender === "female" ? "Эм" : "Бусад";
                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 !== 0 ? "bg-muted/10" : ""}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.patientCode}</td>
                        <td className="px-4 py-3 font-medium">{p.lastName} {p.firstName}</td>
                        <td className="px-4 py-3 text-muted-foreground">{age !== null ? `${age} нас` : "—"} · {genderLabel}</td>
                        <td className="px-4 py-3 font-mono text-xs">{p.phone}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateMn(p.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                            <Link href={`/patients/${p.id}`}>Дэлгэрэнгүй</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Нийт {data.total} өвчтөн · {page}/{totalPages} хуудас
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const pageNum = start + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────── */
function StatCard({ def, data }: { def: StatDef; data?: DashboardStats }) {
  const Icon = def.icon;
  const raw = data?.[def.key] ?? undefined;
  const value = raw === undefined ? "—" : def.format === "mnt" ? formatMnt(raw as number) : raw;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{def.label}</span>
          <div className={`h-8 w-8 rounded-md flex items-center justify-center ${def.tone}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

/* ─── Role description chips ─────────────────────────────────────────── */
const ROLE_DESCRIPTION: Record<Role, string> = {
  admin:     "Бүх хэсэгт хандах эрхтэй",
  manager:   "Тайлан болон удирдлагын хэсэгт хандах эрхтэй",
  reception: "Өвчтөн бүртгэл, цаг захиалга, нэхэмжлэл",
  doctor:    "Үзлэг, өвчтөний мэдээлэл, EMR",
  nurse:     "Дараалал болон үзлэгийн туслалцаа",
};

/* ─── Main dashboard ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn:  getDashboardStats,
    refetchInterval: 30_000,
  });

  if (!user) return null;

  const role = user.role as Role;
  const statKeys = ROLE_STATS[role] ?? ROLE_STATS.admin;
  const statDefs = ALL_STATS.filter((s) => statKeys.includes(s.key));
  const actions  = QUICK_ACTIONS.filter((a) => a.roles.includes(role));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Хяналтын самбар</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Сайн байна уу, <strong>{user.fullName}</strong> ·{" "}
            <span className="inline-flex items-center gap-1">
              {ROLE_LABELS_MN[role]}
              <span className="text-muted-foreground/60">— {ROLE_DESCRIPTION[role]}</span>
            </span>
          </p>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            30с тутамд шинэчлэгдэнэ
          </span>
        )}
      </div>

      {/* Role-specific stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statDefs.map((def) => (
          <StatCard key={def.key} def={def} data={data} />
        ))}
      </div>

      {/* Quick actions */}
      {actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Хурдан үйлдэл</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <Button key={a.href} asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Link href={a.href}>
                      <Icon className="h-5 w-5" />
                      <span>{a.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctor: my patients list */}
      {role === "doctor" && <MyPatientsPanel />}
    </div>
  );
}
