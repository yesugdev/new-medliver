"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck, CheckCircle2, Circle,
  Loader2, ChevronDown, ChevronUp, User, Pill,
  RotateCcw, Trash2, Search, CalendarDays,
} from "lucide-react";
import type { TreatmentTask, TreatmentTaskStatus } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import {
  listTreatmentTasks,
  updateTaskStatus,
  deleteTreatmentTask,
} from "@/lib/treatment-task-api";
import { extractApiError } from "@/lib/api";

/* ─── helpers ───────────────────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("mn-MN", {
    month: "long", day: "numeric", weekday: "short",
  });
}
function fmtTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABEL: Record<TreatmentTaskStatus, string> = {
  pending: "Хийгдэх",
  done:    "Хийгдсэн",
  skipped: "Алгасав",
};
const STATUS_TONE: Record<TreatmentTaskStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  done:    "bg-emerald-100 text-emerald-800 border-emerald-200",
  skipped: "bg-slate-100 text-slate-600 border-slate-200",
};

/* ─── Single task card ──────────────────────────────────────────── */
function TaskCard({ task, canDelete }: { task: TreatmentTask; canDelete: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [noteInput, setNoteInput] = useState("");
  const [showNote, setShowNote] = useState(false);

  const statusMut = useMutation({
    mutationFn: (payload: { status: TreatmentTaskStatus; doneNote?: string }) =>
      updateTaskStatus(task.id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["treatment-tasks"] }),
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const delMut = useMutation({
    mutationFn: () => deleteTreatmentTask(task.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["treatment-tasks"] }),
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  const markDone = () => {
    if (showNote) {
      statusMut.mutate({ status: "done", doneNote: noteInput || undefined });
      setShowNote(false);
      setNoteInput("");
    } else {
      setShowNote(true);
    }
  };

  const isDone    = task.status === "done";
  const isSkipped = task.status === "skipped";
  const isPending = task.status === "pending";

  return (
    <div className={`rounded-lg border transition-colors ${
      isDone    ? "border-emerald-200 bg-emerald-50/30" :
      isSkipped ? "border-slate-200 bg-slate-50/30" :
      "border-border bg-white"
    }`}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Status icon */}
        <button
          type="button"
          disabled={statusMut.isPending}
          onClick={() => {
            if (isPending) markDone();
            else statusMut.mutate({ status: "pending" });
          }}
          className="mt-0.5 shrink-0"
          title={isPending ? "Хийгдсэн гэж тэмдэглэх" : "Буцаах"}
        >
          {statusMut.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : isDone ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : isSkipped ? (
            <Circle className="h-5 w-5 text-slate-300" />
          ) : (
            <Circle className="h-5 w-5 text-amber-400 hover:text-emerald-500 transition-colors" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${isDone || isSkipped ? "line-through text-muted-foreground" : ""}`}>
            {task.drugName}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {task.route && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Pill className="h-3 w-3" />{task.route}
              </span>
            )}
            {task.frequency != null && (
              <span className="text-xs text-muted-foreground">
                {task.frequency} удаа/өдөр{task.perDose != null ? `, 1 удаа ${task.perDose}` : ""}
              </span>
            )}
            {task.notes && (
              <span className="text-xs text-muted-foreground italic">{task.notes}</span>
            )}
          </div>
          {isDone && task.doneByName && (
            <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
              <User className="h-3 w-3" />
              {task.doneByName} — {fmtTime(task.doneAt)}
              {task.doneNote && <span className="ml-1 italic">"{task.doneNote}"</span>}
            </div>
          )}

          {/* Inline note input for marking done */}
          {showNote && isPending && (
            <div className="mt-2 flex gap-2">
              <Input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Тэмдэглэл (заавал биш)..."
                className="h-7 text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && markDone()}
                autoFocus
              />
              <Button size="sm" className="h-7 text-xs px-3" onClick={markDone} disabled={statusMut.isPending}>
                Хийгдсэн
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setShowNote(false)}>
                Болих
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!isPending && (
            <button
              type="button"
              onClick={() => statusMut.mutate({ status: "pending" })}
              disabled={statusMut.isPending}
              title="Буцаах"
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => delMut.mutate()}
              disabled={delMut.isPending}
              title="Устгах"
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Patient group ─────────────────────────────────────────────── */
function PatientGroup({
  patientName, patientCode, patientId, tasks, canDelete,
}: {
  patientName: string;
  patientCode: string;
  patientId: string;
  tasks: TreatmentTask[];
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(true);
  const doneCount    = tasks.filter((t) => t.status === "done").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const allDone = pendingCount === 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          allDone ? "bg-emerald-50/50 hover:bg-emerald-50" : "bg-muted/20 hover:bg-muted/40"
        }`}
      >
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
          allDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}>
          {doneCount}/{tasks.length}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/patients/${patientId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold hover:underline"
          >
            {patientName}
          </Link>
          <div className="text-xs text-muted-foreground font-mono">{patientCode}</div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {pendingCount} үлдсэн
            </span>
          )}
          {allDone && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Дууссан
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 space-y-2 border-t border-border">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} canDelete={canDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function TreatmentTasksPage() {
  const user = useAuthStore((s) => s.user);
  const [date,   setDate]   = useState(todayStr());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const qk = ["treatment-tasks", date, filter === "all" ? undefined : filter];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => listTreatmentTasks({
      date,
      status: filter === "all" ? undefined : filter,
    }),
    refetchInterval: 30_000,
  });

  const canDelete = user?.role === "admin" || user?.role === "doctor";

  /* Filter by search */
  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.patientName.toLowerCase().includes(q) ||
        t.patientCode.toLowerCase().includes(q) ||
        t.drugName.toLowerCase().includes(q),
    );
  }, [tasks, search]);

  /* Group by patient */
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; code: string; tasks: TreatmentTask[] }>();
    for (const t of filtered) {
      if (!map.has(t.patientId)) {
        map.set(t.patientId, { name: t.patientName, code: t.patientCode, tasks: [] });
      }
      map.get(t.patientId)!.tasks.push(t);
    }
    // Sort: patients with pending tasks first
    return [...map.entries()].sort(([, a], [, b]) => {
      const aPending = a.tasks.filter((x) => x.status === "pending").length;
      const bPending = b.tasks.filter((x) => x.status === "pending").length;
      return bPending - aPending;
    });
  }, [filtered]);

  /* Summary counts */
  const totalPending = tasks.filter((t) => t.status === "pending").length;
  const totalDone    = tasks.filter((t) => t.status === "done").length;

  const isToday = date === todayStr();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Эмчилгээний ToDo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Өвчтөнгүүдийн өдөр тутмын эмчилгээний бүртгэл
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date */}
        <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 bg-white">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm bg-transparent outline-none"
          />
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(todayStr())}
              className="text-xs text-primary hover:underline ml-1"
            >
              Өнөөдөр
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex rounded-lg border border-border overflow-hidden bg-white text-sm">
          {(["all", "pending", "done"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "Бүгд" : STATUS_LABEL[f as TreatmentTaskStatus]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Өвчтөн, эм хайх..."
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Summary chips */}
      {tasks.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm">
            <Circle className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-amber-700">{totalPending}</span>
            <span className="text-muted-foreground">хийгдэх</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-emerald-700">{totalDone}</span>
            <span className="text-muted-foreground">хийгдсэн</span>
          </div>
          <div className="text-sm text-muted-foreground">
            · {fmtDate(date)}
          </div>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm font-medium">
              {search ? "Хайлтад тохирох даалгавар олдсонгүй" : "Энэ өдөрт эмчилгээний даалгавар байхгүй байна"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Эмийн жор бичсэний дараа автоматаар үүснэ
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(([patientId, g]) => (
            <PatientGroup
              key={patientId}
              patientId={patientId}
              patientName={g.name}
              patientCode={g.code}
              tasks={g.tasks}
              canDelete={canDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
