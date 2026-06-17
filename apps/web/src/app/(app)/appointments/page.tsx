"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Plus,
  Loader2,
  PlayCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  List,
  CalendarDays,
} from "lucide-react";
import { APPOINTMENT_STATUS_LABELS_MN, APPOINTMENT_TYPE_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { listAppointments, appointmentAction } from "@/lib/appointments-api";
import { createVisit } from "@/lib/emr-api";
import { AppointmentCalendar } from "@/components/appointment-calendar";
import { APPOINTMENT_TONE } from "@/lib/status-tones";
import { formatTimeMn, toDateInput } from "@/lib/format";
import { extractApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type ViewMode = "list" | "calendar";

export default function AppointmentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [view, setView] = useState<ViewMode>("list");
  const [date, setDate] = useState(toDateInput(new Date()));

  /* ── List query ──────────────────────────────────────────────────── */
  const { data, isLoading } = useQuery({
    queryKey: ["appointments", date],
    queryFn: () => listAppointments({ date }),
    enabled: view === "list",
  });

  /* ── Mutation (list view actions) ───────────────────────────────── */
  const action = useMutation({
    mutationFn: ({
      id,
      act,
    }: {
      id: string;
      act: "check-in" | "start" | "complete" | "cancel" | "no-show";
    }) => appointmentAction(id, act),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Шинэчиллээ", variant: "success" });
    },
    onError: (err) => {
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" });
    },
  });

  /* ── Start visit: create visit (idempotent) then navigate ─────── */
  const startVisit = useMutation({
    mutationFn: ({ appointmentId, patientId }: { appointmentId: string; patientId: string }) =>
      createVisit({ patientId, appointmentId }),
    onSuccess: (visit) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      router.push(`/emr/visit?visitId=${visit.id}&patientId=${visit.patientId}`);
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const canCreate = user && (user.role === "admin" || user.role === "reception");
  const canCheckIn = user && ["admin", "reception", "nurse"].includes(user.role);
  const canStartComplete = user && (user.role === "admin" || user.role === "doctor");

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Цаг захиалга
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {view === "list" ? "Сонгосон өдрийн цагийн жагсаалт" : "Сарын хуанлийн харагдац"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "list"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Жагсаалт
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "calendar"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Хуанли
            </button>
          </div>

          {canCreate && (
            <Button asChild>
              <Link href="/appointments/new">
                <Plus className="h-4 w-4" />
                Цаг захиалах
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Calendar view ────────────────────────────────────────────── */}
      {view === "calendar" && (
        <Card className="p-5">
          <AppointmentCalendar
            onDayClick={(ds) => {
              setDate(ds);
              setView("list");
            }}
          />
        </Card>
      )}

      {/* ── List view ────────────────────────────────────────────────── */}
      {view === "list" && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Огноо:</span>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
            {data && (
              <span className="text-sm text-muted-foreground ml-auto">
                Нийт: {data.total}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Цаг</th>
                  <th>Дугаар</th>
                  <th>Өвчтөн</th>
                  <th>Эмч</th>
                  <th>Төрөл</th>
                  <th>Статус</th>
                  <th className="text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : data && data.items.length > 0 ? (
                  data.items.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono text-xs">{formatTimeMn(a.scheduledAt)}</td>
                      <td>{a.queueNumber ?? "—"}</td>
                      <td>
                        <Link
                          href={`/patients/${a.patientId}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">{a.patientName}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {a.patientCode}
                          </div>
                        </Link>
                      </td>
                      <td>{a.doctorName}</td>
                      <td className="text-xs text-muted-foreground">
                        {APPOINTMENT_TYPE_LABELS_MN[a.type]}
                      </td>
                      <td>
                        <Badge tone={APPOINTMENT_TONE[a.status]}>
                          {APPOINTMENT_STATUS_LABELS_MN[a.status]}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex gap-1 justify-end">
                          {a.status === "scheduled" && canCheckIn && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => action.mutate({ id: a.id, act: "check-in" })}
                              disabled={action.isPending}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Бүртгэх
                            </Button>
                          )}
                          {a.status === "waiting" && canStartComplete && (
                            <Button
                              size="sm"
                              disabled={startVisit.isPending}
                              onClick={() =>
                                startVisit.mutate({ appointmentId: a.id, patientId: a.patientId })
                              }
                            >
                              {startVisit.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <PlayCircle className="h-3.5 w-3.5" />
                              )}
                              Эхлүүлэх
                            </Button>
                          )}
                          {a.status === "in_progress" && canStartComplete && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={startVisit.isPending}
                                onClick={() =>
                                  startVisit.mutate({ appointmentId: a.id, patientId: a.patientId })
                                }
                              >
                                {startVisit.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <PlayCircle className="h-3.5 w-3.5" />
                                )}
                                EMR
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => action.mutate({ id: a.id, act: "complete" })}
                                disabled={action.isPending}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Дуусгах
                              </Button>
                            </>
                          )}
                          {["scheduled", "waiting"].includes(a.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => action.mutate({ id: a.id, act: "cancel" })}
                              disabled={action.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Энэ өдөр цаг алга
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
