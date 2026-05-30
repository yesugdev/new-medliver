"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Save, CheckCircle2, Lock, User as UserIcon,
  ArrowLeft, ChevronDown, ChevronUp, FileText,
} from "lucide-react";
import type { EmrTabConfig, EmrSectionConfig, EmrFieldConfig } from "@his/shared";
import { VISIT_STATUS_LABELS_MN } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { createVisit, getVisit, updateVisit } from "@/lib/emr-api";
import { getEmrTemplate } from "@/lib/emr-template-api";
import { getPatient } from "@/lib/patients-api";
import { extractApiError } from "@/lib/api";
import { formatDateTimeMn } from "@/lib/utils";
import { VISIT_TONE } from "@/lib/status-tones";
import { PatientVitals } from "@/components/patient-vitals";
import { PatientTreatment } from "@/components/patient-treatment";

/* ─── Read-only field ────────────────────────────────────────────────── */
function ReadField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1.5">
      {label && <div className="text-xs font-medium text-muted-foreground">{label}</div>}
      <div className="min-h-[2.5rem] rounded-md border border-border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
        {value || <span className="text-muted-foreground italic">—</span>}
      </div>
    </div>
  );
}

/* ─── Dynamic field renderer ─────────────────────────────────────────── */
function DynamicField({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: EmrFieldConfig;
  value: string | number | boolean | undefined;
  onChange: (val: string | number | boolean) => void;
  readOnly?: boolean;
}) {
  const strVal = value === undefined || value === null ? "" : String(value);

  /* Separator — same in edit and read-only mode */
  if (field.type === "separator") {
    return (
      <div className="md:col-span-2 flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-border" />
        {field.label && (
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
            {field.label}
          </span>
        )}
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  if (readOnly) {
    if (field.type === "checkbox") {
      const hasOpts = (field.options?.length ?? 0) > 0;
      if (!hasOpts) {
        const checked = value === true || value === "true";
        return (
          <div className="flex items-center gap-2 py-1">
            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? "border-primary bg-primary" : "border-muted-foreground"}`}>
              {checked && <div className="h-2 w-2 bg-white rounded-sm" />}
            </div>
            <span className="text-sm">{field.label}</span>
          </div>
        );
      }
      // Multi-checkbox read-only
      const selected = strVal ? strVal.split(",").map((s) => s.trim()).filter(Boolean) : [];
      return (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">{field.label}</div>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt, i) => (
              <span key={`${i}-${opt}`}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                  selected.includes(opt)
                    ? "bg-primary/10 border-primary/40 text-primary font-medium"
                    : "bg-muted/30 border-border text-muted-foreground"
                }`}>
                {selected.includes(opt) && <span className="text-[10px]">✓</span>}
                {opt}
              </span>
            ))}
            {selected.length === 0 && <span className="text-xs text-muted-foreground italic">—</span>}
          </div>
        </div>
      );
    }
    return <ReadField label={field.label} value={strVal} />;
  }

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            rows={3}
            placeholder={field.placeholder}
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <select
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Сонгох —</option>
            {field.options?.map((opt, i) => (
              <option key={`${i}-${opt}`} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="number"
            placeholder={field.placeholder}
            value={strVal}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
      );

    case "radio":
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex flex-wrap gap-3">
            {field.options?.map((opt, i) => (
              <label key={`${i}-${opt}`} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={strVal === opt}
                  onChange={() => onChange(opt)}
                  className="accent-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case "checkbox": {
      const hasOpts = (field.options?.length ?? 0) > 0;
      if (!hasOpts) {
        // Single boolean checkbox
        const checked = value === true || value === "true";
        return (
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </span>
          </label>
        );
      }
      // Multi-select checkboxes — value stored as comma-separated string
      const selected = strVal ? strVal.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const toggleOpt = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt];
        onChange(next.join(","));
      };
      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex flex-wrap gap-3">
            {field.options?.map((opt, i) => (
              <label key={`${i}-${opt}`} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOpt(opt)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    default: // text
      return (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            {field.label}
            {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="text"
            placeholder={field.placeholder}
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}

/* ─── Accordion section ──────────────────────────────────────────────── */
function AccordionSection({
  section,
  patientId,
  sectionNotes,
  onNoteChange,
  canEdit,
}: {
  section: EmrSectionConfig;
  patientId: string;
  sectionNotes: Record<string, string | number | boolean>;
  onNoteChange: (fieldId: string, val: string | number | boolean) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="text-sm font-semibold">{section.name}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Accordion content */}
      {open && (
        <div className="px-4 py-4">
          {section.type === "vitals" ? (
            /* Vitals module — embedded PatientVitals component */
            <PatientVitals patientId={patientId} />
          ) : section.fields && section.fields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className={["textarea", "radio", "separator"].includes(field.type) ? "md:col-span-2" : ""}
                >
                  <DynamicField
                    field={field}
                    value={sectionNotes[field.id]}
                    onChange={(val) => onNoteChange(field.id, val)}
                    readOnly={!canEdit}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Энэ хэсэгт тохируулсан талбар байхгүй байна.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main form ──────────────────────────────────────────────────────── */
function VisitForm() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const patientId     = params.get("patientId") ?? "";
  const appointmentId = params.get("appointmentId") ?? undefined;
  const visitIdParam  = params.get("visitId") ?? "";

  const [visitId, setVisitId]     = useState(visitIdParam);
  const [activeTab, setActiveTab] = useState(0); // 0 = Tab1 (visit info), 1+ = template tabs

  /* Tab 1 form state */
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms,       setSymptoms]       = useState("");
  const [diagnosis,      setDiagnosis]      = useState("");
  const [notes,          setNotes]          = useState("");

  /* Tab 2+ clinical notes: Record<sectionId, Record<fieldId, value>> */
  const [clinicalNotes, setClinicalNotes] = useState<Record<string, Record<string, string | number | boolean>>>({});

  const populated = useRef(false);

  /* ── Queries ──────────────────────────────────────────────────────── */
  const patient = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId),
    enabled: Boolean(patientId),
  });

  const existingVisit = useQuery({
    queryKey: ["visit", visitId],
    queryFn: () => getVisit(visitId),
    enabled: Boolean(visitId),
  });

  const templateQuery = useQuery({
    queryKey: ["emr-template"],
    queryFn: getEmrTemplate,
  });

  const templateTabs: EmrTabConfig[] = templateQuery.data?.tabs ?? [];

  /* Populate form once when visit data arrives */
  useEffect(() => {
    if (existingVisit.data && !populated.current) {
      populated.current = true;
      const v = existingVisit.data;
      setChiefComplaint(v.chiefComplaint ?? "");
      setSymptoms(v.symptoms ?? "");
      setDiagnosis(v.diagnosis ?? "");
      setNotes(v.notes ?? "");
      setClinicalNotes((v.clinicalNotes as Record<string, Record<string, string | number | boolean>>) ?? {});
    }
  }, [existingVisit.data]);

  /* Reset populated flag when visitId changes */
  useEffect(() => {
    populated.current = false;
  }, [visitId]);

  /* ── Auto-create if no visitId ────────────────────────────────────── */
  const ensureVisit = useMutation({
    mutationFn: () => createVisit({ patientId, appointmentId }),
    onSuccess: (v) => {
      setVisitId(v.id);
      router.replace(`/emr/visit?visitId=${v.id}&patientId=${patientId}`);
    },
  });

  useEffect(() => {
    if (patientId && !visitId && !ensureVisit.isPending && !ensureVisit.isSuccess) {
      ensureVisit.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, visitId]);

  /* ── Ownership / edit permission ──────────────────────────────────── */
  const visit = existingVisit.data;
  const canEdit =
    Boolean(user) &&
    Boolean(visit) &&
    (user!.role === "admin" || user!.id === visit!.doctorId);

  /* ── Clinical notes helper ────────────────────────────────────────── */
  function setNote(sectionId: string, fieldId: string, val: string | number | boolean) {
    setClinicalNotes((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] ?? {}),
        [fieldId]: val,
      },
    }));
  }

  /* ── Save mutation ────────────────────────────────────────────────── */
  const save = useMutation({
    mutationFn: (status?: "completed") =>
      updateVisit(visitId, {
        chiefComplaint,
        symptoms,
        diagnosis,
        notes,
        clinicalNotes,
        status,
      }),
    onSuccess: (_, status) => {
      toast({
        title: status === "completed" ? "Үзлэг дууссан" : "Хадгаллаа",
        variant: "success",
      });
      qc.invalidateQueries({ queryKey: ["visits-by-patient", patientId] });
      qc.invalidateQueries({ queryKey: ["visit", visitId] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      if (status === "completed") {
        router.push(`/patients/${patientId}`);
      }
    },
    onError: (err) =>
      toast({ title: "Алдаа", description: extractApiError(err), variant: "destructive" }),
  });

  /* ── Loading states ───────────────────────────────────────────────── */
  if (!patientId) {
    return <div className="text-center py-20 text-muted-foreground">Өвчтөн сонгоогүй</div>;
  }
  if (!visitId || existingVisit.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /* ─── Tab bar ────────────────────────────────────────────────────── */
  const tabItems = [
    { label: "Үзлэгийн мэдээлэл" },
    ...templateTabs.map((t) => ({ label: t.name })),
  ];

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            onClick={() => (patientId ? router.push(`/patients/${patientId}`) : router.back())}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Үзлэгийн карт</h1>
            {patient.data && (
              <p className="text-sm text-muted-foreground mt-1">
                {patient.data.lastName} {patient.data.firstName} ·{" "}
                <span className="font-mono">{patient.data.patientCode}</span>
              </p>
            )}
          </div>
        </div>
        {visit && (
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone={VISIT_TONE[visit.status]}>
              {VISIT_STATUS_LABELS_MN[visit.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDateTimeMn(visit.visitDate)}
            </span>
          </div>
        )}
      </div>

      {/* Doctor info / ownership notice */}
      {visit && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm border ${
            canEdit
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {canEdit ? (
            <UserIcon className="h-4 w-4 shrink-0" />
          ) : (
            <Lock className="h-4 w-4 shrink-0" />
          )}
          <span>
            <strong>Эмч:</strong> {visit.doctorName}
            {!canEdit && (
              <span className="ml-2 opacity-80">— Зөвхөн тухайн эмч засах боломжтой</span>
            )}
          </span>
        </div>
      )}

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabItems.map((tab, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === idx
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {idx > 0 && <FileText className="inline h-3.5 w-3.5 mr-1.5 opacity-70" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Үзлэгийн мэдээлэл ────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="space-y-6">
          {/* Clinical info */}
          <Card>
            <CardHeader>
              <CardTitle>Үзлэгийн мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit ? (
                <>
                  <div className="space-y-2">
                    <Label>Зовиур</Label>
                    <Textarea
                      rows={2}
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Шинж тэмдэг</Label>
                    <Textarea
                      rows={3}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Онош</Label>
                    <Textarea
                      rows={2}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReadField label="Зовиур"       value={chiefComplaint} />
                  <ReadField label="Шинж тэмдэг"  value={symptoms} />
                  <ReadField label="Онош"          value={diagnosis} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Treatment — integrated module */}
          <PatientTreatment patientId={patientId} defaultOpen />

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Тэмдэглэл</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              ) : (
                <ReadField label="" value={notes} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 2+: Дэлгэрэнгүй тэмдэглэл (accordion sections) ─────── */}
      {activeTab > 0 && (() => {
        const currentTab = templateTabs[activeTab - 1];
        if (!currentTab) return null;

        return (
          <div className="space-y-3">
            {currentTab.sections
              .slice()
              .sort((a, b) => {
                // vitals section always renders last within its tab
                if (a.type === "vitals" && b.type !== "vitals") return 1;
                if (a.type !== "vitals" && b.type === "vitals") return -1;
                return a.order - b.order;
              })
              .map((section) => (
                <AccordionSection
                  key={section.id}
                  section={section}
                  patientId={patientId}
                  sectionNotes={clinicalNotes[section.id] ?? {}}
                  onNoteChange={(fieldId, val) => setNote(section.id, fieldId, val)}
                  canEdit={canEdit}
                />
              ))}
            {currentTab.sections.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Энэ табд section нэмэгдээгүй байна.</p>
                <p className="text-xs mt-1">Тохиргоо → EMR загвар хэсгээс нэмнэ үү.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Action buttons ───────────────────────────────────────────── */}
      {canEdit && (
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => save.mutate(undefined)}
            disabled={save.isPending}
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Хадгалах
          </Button>
          {visit?.status !== "completed" && (
            <Button
              onClick={() => save.mutate("completed")}
              disabled={save.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Үзлэг дуусгах
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <VisitForm />
    </Suspense>
  );
}
