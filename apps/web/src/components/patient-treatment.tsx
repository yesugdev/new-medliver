"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown, ChevronUp, Plus, Trash2,
  Loader2, Pill, CalendarDays, User,
} from "lucide-react";
import { DRUG_ROUTES } from "@his/shared";
import type { TreatmentDrug, TreatmentRecord } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { createTreatment, deleteTreatment, listTreatments } from "@/lib/treatment-api";
import { extractApiError } from "@/lib/api";
import { formatDateTimeMn } from "@/lib/utils";

/* ─── Empty drug row ─────────────────────────────────────────────── */
const emptyDrug = (): TreatmentDrug => ({
  nameFormDosage: "",
  totalQuantity:  undefined,
  route:          "",
  frequency:      undefined,
  perDose:        undefined,
  duration:       undefined,
  notes:          "",
});

/* ─── Drug row editor ────────────────────────────────────────────── */
function DrugRow({
  drug,
  index,
  onChange,
  onDelete,
  canDelete,
}: {
  drug: TreatmentDrug;
  index: number;
  onChange: (d: TreatmentDrug) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const up = (patch: Partial<TreatmentDrug>) => onChange({ ...drug, ...patch });

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      {/* Row header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground">
          Эм #{index + 1}
        </span>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Устгах
          </button>
        )}
      </div>

      {/* Row 1: name/form/dosage | total qty | route */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_200px] gap-3 px-4 pt-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Эмийн нэр, хэлбэр, тун</Label>
          <Input
            value={drug.nameFormDosage}
            onChange={(e) => up({ nameFormDosage: e.target.value })}
            placeholder="жш: Амоксициллин хавтас 500мг"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Нийт тоо хэмжээ</Label>
          <Input
            type="number"
            min={0}
            value={drug.totalQuantity ?? ""}
            onChange={(e) =>
              up({ totalQuantity: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            placeholder="Тоо оруулна уу"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Эмийг хэрэглэх арга</Label>
          <select
            value={drug.route ?? ""}
            onChange={(e) => up({ route: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Сонгох —</option>
            {DRUG_ROUTES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: frequency | per-dose | duration | notes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pt-3 pb-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Давтамж <span className="font-normal text-muted-foreground">(өдөрт)</span></Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              value={drug.frequency ?? ""}
              onChange={(e) =>
                up({ frequency: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              placeholder="Тоо оруулна уу"
              className="h-9 text-sm pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              удаа
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">1 удаа <span className="font-normal text-muted-foreground">(хэмжээ)</span></Label>
          <Input
            type="number"
            min={0}
            value={drug.perDose ?? ""}
            onChange={(e) =>
              up({ perDose: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            placeholder="Тоо оруулна уу"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Эмийг хэрэглэх хугацаа</Label>
          <div className="relative">
            <Input
              type="number"
              min={0}
              value={drug.duration ?? ""}
              onChange={(e) =>
                up({ duration: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              placeholder="Тоо оруулна уу"
              className="h-9 text-sm pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              өдөр
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Тэмдэглэл</Label>
          <Input
            value={drug.notes ?? ""}
            onChange={(e) => up({ notes: e.target.value })}
            placeholder="Тэмдэглэл..."
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Add treatment form ─────────────────────────────────────────── */
function AddTreatmentForm({
  patientId,
  onSaved,
}: {
  patientId: string;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [drugs, setDrugs] = useState<TreatmentDrug[]>([emptyDrug()]);

  const updateDrug  = (i: number, d: TreatmentDrug) =>
    setDrugs((prev) => prev.map((x, j) => (j === i ? d : x)));
  const deleteDrug  = (i: number) =>
    setDrugs((prev) => prev.filter((_, j) => j !== i));
  const addDrug     = () => setDrugs((prev) => [...prev, emptyDrug()]);

  const save = useMutation({
    mutationFn: () => {
      const valid = drugs.filter((d) => d.nameFormDosage.trim());
      if (valid.length === 0) throw new Error("Эмийн нэр оруулна уу");
      return createTreatment(patientId, { drugs: valid });
    },
    onSuccess: () => {
      toast({ title: "Эмчилгээ хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["treatments", patientId] });
      setDrugs([emptyDrug()]);
      onSaved();
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      {/* Эмийн мэдээлэл header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          Эмийн мэдээлэл
        </h3>
        <Button variant="outline" size="sm" onClick={addDrug} className="h-8">
          <Plus className="h-3.5 w-3.5" />
          Эм нэмэх
        </Button>
      </div>

      {/* Drug rows */}
      <div className="space-y-3">
        {drugs.map((drug, i) => (
          <DrugRow
            key={i}
            drug={drug}
            index={i}
            onChange={(d) => updateDrug(i, d)}
            onDelete={() => deleteDrug(i)}
            canDelete={drugs.length > 1}
          />
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-1">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Plus className="h-4 w-4" />}
          Хадгалах
        </Button>
      </div>
    </div>
  );
}

/* ─── Treatment record card ─────────────────────────────────────── */
function TreatmentCard({
  record,
  patientId,
  canDelete,
}: {
  record: TreatmentRecord;
  patientId: string;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const del = useMutation({
    mutationFn: () => deleteTreatment(patientId, record.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treatments", patientId] });
      toast({ title: "Устгагдлаа", variant: "success" });
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const drugSummary = record.drugs
    .slice(0, 3)
    .map((d) => d.nameFormDosage)
    .join(", ");

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <Pill className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {drugSummary || "Эмчилгээний бүртгэл"}
            {record.drugs.length > 3 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                +{record.drugs.length - 3} эм
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Pill className="h-3 w-3" />{record.drugs.length} эм
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />{record.recordedByName}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />{formatDateTimeMn(record.createdAt)}
            </span>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border bg-muted/5">
          {/* Drug table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["#", "Эмийн нэр, хэлбэр, тун", "Нийт тоо", "Арга", "Давтамж", "1 удаа", "Хугацаа", "Тэмдэглэл"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {record.drugs.map((d, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium">{d.nameFormDosage}</td>
                    <td className="px-3 py-2.5">{d.totalQuantity ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{d.route || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {d.frequency != null ? `${d.frequency} удаа` : "—"}
                    </td>
                    <td className="px-3 py-2.5">{d.perDose ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {d.duration != null ? `${d.duration} өдөр` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">
                      {d.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canDelete && (
            <div className="flex justify-end px-4 py-3 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => del.mutate()}
                disabled={del.isPending}
                className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive h-8"
              >
                {del.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />}
                Устгах
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export function PatientTreatment({ patientId }: { patientId: string }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen]         = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  const canAdd    = user && ["admin", "doctor", "nurse"].includes(user.role);
  const canDelete = user && ["admin", "doctor"].includes(user.role);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["treatments", patientId],
    queryFn:  () => listTreatments(patientId),
    enabled:  open,
  });

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <Pill className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <span className="text-base font-semibold">Эмчилгээ</span>
          {!open && records.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              {records.length} бүртгэл
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
      </button>

      {/* Accordion body */}
      {open && (
        <div className="border-t border-border">
          {/* Tab bar */}
          <div className="flex border-b border-border px-1 bg-muted/10">
            {[
              { key: "list", label: "Эмчилгээний түүх" },
              ...(canAdd ? [{ key: "add", label: "Эмчилгээ нэмэх" }] : []),
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as "list" | "add")}
                className={`relative px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === "list" ? (
              isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Pill className="h-10 w-10 mx-auto mb-3 opacity-25" />
                  <p className="text-sm">Эмчилгээний бүртгэл байхгүй байна.</p>
                  {canAdd && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("add")}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      + Эмчилгээ нэмэх
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((r) => (
                    <TreatmentCard
                      key={r.id}
                      record={r}
                      patientId={patientId}
                      canDelete={!!canDelete}
                    />
                  ))}
                </div>
              )
            ) : (
              <AddTreatmentForm
                patientId={patientId}
                onSaved={() => setActiveTab("list")}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
