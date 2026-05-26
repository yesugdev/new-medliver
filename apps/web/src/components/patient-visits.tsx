"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Plus, X, ArrowRight } from "lucide-react";
import { VISIT_STATUS_LABELS_MN } from "@his/shared";
import type { VisitStatus } from "@his/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { listVisitsByPatient, createVisit } from "@/lib/emr-api";
import { VISIT_TONE } from "@/lib/status-tones";
import { formatDateTimeMn } from "@/lib/utils";
import { extractApiError } from "@/lib/api";

const FILTER_INPUT =
  "h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

const STATUS_OPTS: { value: VisitStatus; label: string }[] = [
  { value: "in_progress", label: "Үзлэг хийгдэж буй" },
  { value: "completed",   label: "Дууссан" },
];

export function PatientVisits({ patientId }: { patientId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canStart = user && ["admin", "doctor", "nurse"].includes(user.role);

  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["visits-by-patient", patientId],
    queryFn:  () => listVisitsByPatient(patientId),
  });

  const doctors = useMemo(
    () => [...new Set(data.map((v) => v.doctorName))].sort(),
    [data],
  );

  const filtered = useMemo(() => {
    return data.filter((v) => {
      if (statusFilter && v.status !== statusFilter) return false;
      if (doctorFilter && v.doctorName !== doctorFilter) return false;
      if (dateFrom && new Date(v.visitDate) < new Date(dateFrom)) return false;
      if (dateTo   && new Date(v.visitDate) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [data, statusFilter, doctorFilter, dateFrom, dateTo]);

  const hasFilter = statusFilter || doctorFilter || dateFrom || dateTo;
  const clearFilters = () => {
    setStatusFilter(""); setDoctorFilter(""); setDateFrom(""); setDateTo("");
  };

  const start = useMutation({
    mutationFn: () => createVisit({ patientId }),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: ["visits-by-patient", patientId] });
      router.push(`/emr/visit?visitId=${v.id}&patientId=${patientId}`);
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  return (
    <Card>
      {/* ── Header ── */}
      <CardHeader className="py-3 px-5 border-b border-border flex-row items-center justify-between gap-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-500" />
          Үзлэгийн түүх
          {data.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {hasFilter ? `${filtered.length}/${data.length}` : data.length}
            </span>
          )}
        </CardTitle>
        {canStart && (
          <Button size="sm" onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Шинэ үзлэг
          </Button>
        )}
      </CardHeader>

      {/* ── Filter bar ── */}
      {data.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-muted/20 border-b border-border">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={FILTER_INPUT} />
          <span className="text-xs text-muted-foreground">—</span>
          <input type="date" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   className={FILTER_INPUT} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={FILTER_INPUT}>
            <option value="">Бүх статус</option>
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {doctors.length > 1 && (
            <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className={FILTER_INPUT}>
              <option value="">Бүх эмч</option>
              {doctors.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          {hasFilter && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" /> Арилгах
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Үзлэг бүртгэгдээгүй</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-6 text-center">Шүүлтэнд тохирох үзлэг олдсонгүй</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground w-36">Огноо</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground w-32">Эмч</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Зовиур</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Онош</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground w-36">Статус</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => router.push(`/emr/visit?visitId=${v.id}&patientId=${patientId}`)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-5 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {formatDateTimeMn(v.visitDate)}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-blue-700 whitespace-nowrap">
                      {v.doctorName}
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground max-w-[200px]">
                      <span className="line-clamp-1">
                        {v.chiefComplaint || <span className="text-muted-foreground italic">—</span>}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground max-w-[200px]">
                      <span className="line-clamp-1">
                        {v.diagnosis || <span className="text-muted-foreground italic">—</span>}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={VISIT_TONE[v.status]}>
                        {VISIT_STATUS_LABELS_MN[v.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
