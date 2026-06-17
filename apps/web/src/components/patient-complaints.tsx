"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { ComplaintLine } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getComplaintOptions,
  getPatientComplaints,
  createPatientComplaint,
  deletePatientComplaint,
} from "@/lib/complaints-api";

/* ─── Helpers ────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const emptyLine = (): ComplaintLine => ({
  complaintName: "",
  locationName: "",
  notes: "",
});

/* ─── Tab bar ────────────────────────────────────────────────────── */

function Tabs({
  active,
  onChange,
}: {
  active: number;
  onChange: (i: number) => void;
}) {
  const labels = ["Зовуурь", "Зовуурь нэмэх"];
  return (
    <div className="flex border-b border-border mb-4">
      {labels.map((l, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            active === i
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ─── Select cell ────────────────────────────────────────────────── */

function SelectCell({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-9 rounded border border-border bg-background px-2 text-sm",
        "focus:outline-none focus:ring-1 focus:ring-ring",
        !value && "text-muted-foreground",
      )}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* ─── List tab ───────────────────────────────────────────────────── */

function ComplaintList({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["patient-complaints", patientId],
    queryFn: () => getPatientComplaints(patientId),
  });

  const deleteMutation = useMutation({
    mutationFn: (cid: string) => deletePatientComplaint(patientId, cid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patient-complaints", patientId] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground text-sm">
        <AlertCircle className="h-5 w-5" />
        Зовуурийн бүртгэл байхгүй байна
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/60 text-left">
            {["Огноо", "Эмч", "Зовуурь", "Байрлал", "Нэмэлт мэдээлэл", ""].map((h) => (
              <th key={h} className="px-3 py-2.5 text-xs font-semibold text-muted-foreground border border-border whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.flatMap((record) =>
            record.lines.map((line, li) => (
              <tr key={`${record.id}-${li}`} className="border-b border-border hover:bg-muted/20">
                <td className="px-3 py-2 border border-border whitespace-nowrap text-muted-foreground">
                  {li === 0 ? formatDate(record.date) : ""}
                </td>
                <td className="px-3 py-2 border border-border whitespace-nowrap">
                  {li === 0 ? record.doctorName : ""}
                </td>
                <td className="px-3 py-2 border border-border font-medium">{line.complaintName}</td>
                <td className="px-3 py-2 border border-border">{line.locationName}</td>
                <td className="px-3 py-2 border border-border text-muted-foreground">{line.notes}</td>
                <td className="px-3 py-2 border border-border text-center">
                  {li === 0 ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(record.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Add tab ────────────────────────────────────────────────────── */

function AddComplaint({ patientId }: { patientId: string }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(today());
  const [lines, setLines] = useState<ComplaintLine[]>([emptyLine()]);

  const { data: options } = useQuery({
    queryKey: ["complaint-options"],
    queryFn: getComplaintOptions,
    staleTime: 5 * 60 * 1000,
  });

  const complaintNames = options?.filter((o) => o.category === "complaint" && o.isActive).map((o) => o.name) ?? [];
  const locationNames  = options?.filter((o) => o.category === "location"  && o.isActive).map((o) => o.name) ?? [];

  const saveMutation = useMutation({
    mutationFn: () =>
      createPatientComplaint(patientId, {
        date,
        lines: lines.filter((l) => l.complaintName),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient-complaints", patientId] });
      setLines([emptyLine()]);
      setDate(today());
    },
  });

  const updateLine = (i: number, field: keyof ComplaintLine, val: string) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: val } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (i: number) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      {/* Date row */}
      <div className="flex items-center gap-3 text-sm">
        <label className="text-muted-foreground whitespace-nowrap">Огноо</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-9 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Lines table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/60">
              {["Зовуурь", "Байрлал", "Нэмэлт мэдээлэл", "Устгах"].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-xs font-semibold text-center text-muted-foreground border-b border-border"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-3 py-2 w-56">
                  <SelectCell
                    value={line.complaintName}
                    options={complaintNames}
                    placeholder="Сонгох..."
                    onChange={(v) => updateLine(i, "complaintName", v)}
                  />
                </td>
                <td className="px-3 py-2 w-48">
                  <SelectCell
                    value={line.locationName}
                    options={locationNames}
                    placeholder="Сонгох..."
                    onChange={(v) => updateLine(i, "locationName", v)}
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    rows={1}
                    value={line.notes}
                    onChange={(e) => updateLine(i, "notes", e.target.value)}
                    placeholder="Шаардлагатай нэмэлт мэдээллийг бичих"
                    className="w-full min-h-[36px] rounded border border-border bg-background px-2 py-1.5 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-destructive text-white hover:bg-destructive/80"
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add line + save */}
      <div className="flex items-center justify-between">
        <Button variant="default" size="sm" onClick={addLine} type="button">
          <Plus className="h-4 w-4" />
          Нэмэх
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setLines([emptyLine()]); setDate(today()); }}
            type="button"
          >
            Цуцлах
          </Button>
          <Button
            size="sm"
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || lines.every((l) => !l.complaintName)}
            type="button"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Хадгалах
          </Button>
        </div>
      </div>

      {saveMutation.isSuccess && (
        <p className="text-xs text-green-600">Амжилттай хадгаллаа.</p>
      )}
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────── */

export function PatientComplaints({ patientId }: { patientId: string }) {
  const [tab, setTab] = useState(0);

  return (
    <Card>
      <CardContent className="pt-5">
        <Tabs active={tab} onChange={setTab} />
        {tab === 0 ? (
          <ComplaintList patientId={patientId} />
        ) : (
          <AddComplaint patientId={patientId} />
        )}
      </CardContent>
    </Card>
  );
}
