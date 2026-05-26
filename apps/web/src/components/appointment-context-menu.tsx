"use client";

import { useEffect, useRef } from "react";
import type { Appointment, AppointmentStatus } from "@his/shared";
import { APPOINTMENT_STATUS_LABELS_MN } from "@his/shared";
import { UserCheck, PlayCircle, CheckCircle2, XCircle, UserX, Loader2 } from "lucide-react";
import { APPOINTMENT_TONE } from "@/lib/status-tones";
import { Badge } from "@/components/ui/badge";

export type ApptAction = "check-in" | "start" | "complete" | "cancel" | "no-show";

interface MenuItem {
  action: ApptAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  cap: "checkIn" | "startComplete" | "cancel";
}

const ACTIONS_BY_STATUS: Partial<Record<AppointmentStatus, MenuItem[]>> = {
  scheduled: [
    {
      action: "check-in",
      label: "Бүртгэх",
      icon: UserCheck,
      className: "text-sky-600 hover:bg-sky-50",
      cap: "checkIn",
    },
    {
      action: "cancel",
      label: "Цуцлах",
      icon: XCircle,
      className: "text-rose-600 hover:bg-rose-50",
      cap: "cancel",
    },
  ],
  waiting: [
    {
      action: "start",
      label: "Эхлүүлэх",
      icon: PlayCircle,
      className: "text-emerald-600 hover:bg-emerald-50",
      cap: "startComplete",
    },
    {
      action: "no-show",
      label: "Ирээгүй тэмдэглэх",
      icon: UserX,
      className: "text-orange-500 hover:bg-orange-50",
      cap: "cancel",
    },
    {
      action: "cancel",
      label: "Цуцлах",
      icon: XCircle,
      className: "text-rose-600 hover:bg-rose-50",
      cap: "cancel",
    },
  ],
  in_progress: [
    {
      action: "complete",
      label: "Үзлэг дуусгах",
      icon: CheckCircle2,
      className: "text-indigo-600 hover:bg-indigo-50",
      cap: "startComplete",
    },
  ],
};

interface Props {
  appointment: Appointment;
  position: { x: number; y: number };
  onAction: (id: string, act: ApptAction) => void;
  onClose: () => void;
  canCheckIn: boolean;
  canStartComplete: boolean;
  canCancel: boolean;
  isPending: boolean;
}

export function AppointmentContextMenu({
  appointment,
  position,
  onAction,
  onClose,
  canCheckIn,
  canStartComplete,
  canCancel,
  isPending,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const capMap: Record<string, boolean> = {
    checkIn: canCheckIn,
    startComplete: canStartComplete,
    cancel: canCancel,
  };

  const items = (ACTIONS_BY_STATUS[appointment.status] ?? []).filter(
    (item) => capMap[item.cap],
  );

  const time = new Date(appointment.scheduledAt).toLocaleTimeString("mn-MN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  /* Keep menu inside viewport */
  const MENU_W = 220;
  const MENU_H = 70 + items.length * 42;
  const x = Math.min(position.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - MENU_W - 8);
  const y = Math.min(position.y, (typeof window !== "undefined" ? window.innerHeight : 800) - MENU_H - 8);

  return (
    <div
      ref={menuRef}
      style={{ left: x, top: y, width: MENU_W }}
      className="fixed z-50 rounded-xl border border-border bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate">{appointment.patientName}</span>
          <Badge tone={APPOINTMENT_TONE[appointment.status]} className="shrink-0">
            {APPOINTMENT_STATUS_LABELS_MN[appointment.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {time} · {appointment.doctorName}
        </p>
      </div>

      {/* Actions */}
      {items.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground">
          Одоо хийх үйлдэл байхгүй
        </p>
      ) : (
        <ul className="py-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.action}>
                <button
                  disabled={isPending}
                  onClick={() => {
                    onAction(appointment.id, item.action);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-50 ${item.className}`}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
