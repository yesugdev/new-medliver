"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { Appointment } from "@his/shared";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { listAppointments, appointmentAction } from "@/lib/appointments-api";
import {
  AppointmentContextMenu,
  type ApptAction,
} from "@/components/appointment-context-menu";
import { extractApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

/* ─── Mongolian locale ──────────────────────────────────────────────── */
const MN_MONTHS = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар",
  "5-р сар", "6-р сар", "7-р сар", "8-р сар",
  "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];
const MN_DOW_SHORT = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

/* ─── Status chip colours ───────────────────────────────────────────── */
const STATUS_CHIP: Record<string, string> = {
  scheduled:   "bg-sky-100   text-sky-700   border-sky-200",
  waiting:     "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed:   "bg-gray-100  text-gray-500  border-gray-200",
  cancelled:   "bg-rose-100  text-rose-400  border-rose-200 line-through opacity-60",
  no_show:     "bg-orange-100 text-orange-500 border-orange-200 opacity-60",
};

/* ─── Helpers ───────────────────────────────────────────────────────── */
function getMonthRange(year: number, month: number) {
  const from = new Date(year, month, 1).toISOString().slice(0, 10);
  // last day of month + 1 day boundary so we don't miss late-night appointments
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString().slice(0, 10);
  return { from, to };
}

/** Returns 42 Date objects (6 rows × 7 cols), Monday-first */
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Monday = 0 offset
  const startOffset = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  while (days.length < 42) {
    days.push(new Date(year, month + 1, days.length - startOffset - last.getDate() + 1));
  }
  return days;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

/* ─── Types ─────────────────────────────────────────────────────────── */
interface ContextMenu {
  appointment: Appointment;
  position: { x: number; y: number };
}

interface Props {
  /** Called when the user clicks a day cell (switch to list view for that date) */
  onDayClick?: (dateStr: string) => void;
}

/* ─── Component ─────────────────────────────────────────────────────── */
export function AppointmentCalendar({ onDayClick }: Props) {
  const today = new Date();
  const todayStr = toDateStr(today);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  /* ── Data ─────────────────────────────────────────────────────────── */
  const { from, to } = getMonthRange(year, month);

  const { data, isLoading } = useQuery({
    queryKey: ["appt-calendar", year, month],
    queryFn: () => listAppointments({ from, to, pageSize: 1000 }),
  });

  /* ── Mutation ─────────────────────────────────────────────────────── */
  const action = useMutation({
    mutationFn: ({ id, act }: { id: string; act: ApptAction }) =>
      appointmentAction(id, act),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appt-calendar"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Амжилттай шинэчиллээ", variant: "success" });
    },
    onError: (err) => {
      toast({ title: "Алдаа гарлаа", description: extractApiError(err), variant: "destructive" });
    },
  });

  /* ── Roles ────────────────────────────────────────────────────────── */
  const canCheckIn    = !!user && ["admin", "reception", "nurse"].includes(user.role);
  const canStartComplete = !!user && ["admin", "doctor"].includes(user.role);
  const canCancel     = !!user && ["admin", "reception"].includes(user.role);

  /* ── Navigation ───────────────────────────────────────────────────── */
  const prevMonth = useCallback(() => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }, [month]);

  const goToday = useCallback(() => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }, [today]);

  /* ── Build grid & group appointments ─────────────────────────────── */
  const grid = buildGrid(year, month);

  const byDate: Record<string, Appointment[]> = {};
  for (const appt of data?.items ?? []) {
    const key = appt.scheduledAt.slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(appt);
  }

  /* ── Double-click handler ─────────────────────────────────────────── */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, appt: Appointment) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ appointment: appt, position: { x: e.clientX, y: e.clientY } });
    },
    [],
  );

  const MAX_CHIPS = 3;

  return (
    <div className="relative select-none">
      {/* ── Month navigation ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={prevMonth} className="px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold w-40 text-center tracking-tight">
            {year} · {MN_MONTHS[month]}
          </h2>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="px-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className="text-xs"
          >
            Өнөөдөр
          </Button>
        </div>
      </div>

      {/* ── Day-of-week header ────────────────────────────────────────── */}
      <div className="grid grid-cols-7 mb-1">
        {MN_DOW_SHORT.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted-foreground py-1.5 tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 border-t border-l border-border rounded-lg overflow-hidden">
        {grid.map((day, idx) => {
          const ds = toDateStr(day);
          const isCurrentMonth = day.getMonth() === month;
          const isToday = ds === todayStr;
          const appointments = byDate[ds] ?? [];
          const visible = appointments.slice(0, MAX_CHIPS);
          const overflow = appointments.length - MAX_CHIPS;

          return (
            <div
              key={idx}
              className={[
                "min-h-[108px] border-b border-r border-border p-1.5 flex flex-col gap-0.5 transition-colors",
                isCurrentMonth ? "bg-white" : "bg-muted/30",
                isCurrentMonth && !isToday ? "hover:bg-sky-50/40 cursor-pointer" : "",
              ].join(" ")}
              onClick={() => isCurrentMonth && onDayClick?.(ds)}
            >
              {/* Date number */}
              <div className="flex items-start justify-end mb-0.5">
                <span
                  className={[
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-primary text-white font-bold"
                      : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Appointment chips */}
              {visible.map((appt) => {
                const chipTime = new Date(appt.scheduledAt).toLocaleTimeString("mn-MN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={appt.id}
                    title={`[Давхар дарж төлөв өөрчлөх]\n${appt.patientName} — ${chipTime}\n${appt.doctorName}`}
                    className={[
                      "text-[10px] leading-snug px-1.5 py-0.5 rounded border truncate cursor-pointer",
                      "transition-opacity hover:opacity-80 active:opacity-60",
                      STATUS_CHIP[appt.status] ?? "bg-gray-100 text-gray-600 border-gray-200",
                    ].join(" ")}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => handleDoubleClick(e, appt)}
                  >
                    <span className="font-mono opacity-70">{chipTime}</span>{" "}
                    {appt.patientName}
                  </div>
                );
              })}

              {overflow > 0 && (
                <button
                  className="text-[10px] text-primary hover:underline text-left mt-0.5 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDayClick?.(ds);
                  }}
                >
                  +{overflow} дэлгэрэнгүй
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mt-3 text-[10px]">
        {Object.entries({
          scheduled:   "Товлогдсон",
          waiting:     "Хүлээж буй",
          in_progress: "Үзлэгт",
          completed:   "Дууссан",
          cancelled:   "Цуцалсан",
          no_show:     "Ирээгүй",
        }).map(([status, label]) => (
          <span key={status} className={`px-2 py-0.5 rounded border ${STATUS_CHIP[status]}`}>
            {label}
          </span>
        ))}
        <span className="text-muted-foreground ml-1 italic">
          · Давхар дарж төлөв өөрчлөх
        </span>
      </div>

      {/* ── Context menu ─────────────────────────────────────────────── */}
      {contextMenu && (
        <AppointmentContextMenu
          appointment={contextMenu.appointment}
          position={contextMenu.position}
          onAction={(id, act) => action.mutate({ id, act })}
          onClose={() => setContextMenu(null)}
          canCheckIn={canCheckIn}
          canStartComplete={canStartComplete}
          canCancel={canCancel}
          isPending={action.isPending}
        />
      )}
    </div>
  );
}
