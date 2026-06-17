"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Save, CheckCircle2, Lock, User as UserIcon,
  ArrowLeft, ChevronDown, FileText, Printer,
} from "lucide-react";
import type { EmrTabConfig, EmrSectionConfig, EmrFieldConfig } from "@his/shared";
import { VISIT_STATUS_LABELS_MN, APPOINTMENT_TYPE_LABELS_MN } from "@his/shared";
import type { AppointmentType } from "@his/shared";
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
import { formatDateTimeMn, cn } from "@/lib/utils";
import { VISIT_TONE } from "@/lib/status-tones";
import { PatientVitals } from "@/components/patient-vitals";
import { PatientTreatment } from "@/components/patient-treatment";
import { getPrintConfig } from "@/lib/print-config-api";
import { openPrintWindow, buildPatientMeta, cfg } from "@/lib/print-utils";

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
    if (field.type === "radio") {
      return (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{field.label}</div>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt, i) => (
              <span key={`${i}-${opt}`}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border-2",
                  strVal === opt
                    ? "bg-primary border-primary text-white"
                    : "bg-muted/30 border-border text-muted-foreground",
                )}>
                {opt}
              </span>
            ))}
            {!strVal && <span className="text-xs text-muted-foreground italic">—</span>}
          </div>
        </div>
      );
    }
    if (field.type === "checkbox") {
      const hasOpts = (field.options?.length ?? 0) > 0;
      if (!hasOpts) {
        const checked = value === true || value === "true";
        return (
          <span className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-sm font-medium",
            checked
              ? "bg-primary/10 border-primary text-primary"
              : "bg-muted/30 border-border text-muted-foreground",
          )}>
            <div className={cn(
              "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
              checked ? "border-primary bg-primary" : "border-muted-foreground",
            )}>
              {checked && <span className="text-white text-[10px] leading-none">✓</span>}
            </div>
            {field.label}
          </span>
        );
      }
      // Multi-checkbox read-only
      const selected = strVal ? strVal.split(",").map((s) => s.trim()).filter(Boolean) : [];
      return (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{field.label}</div>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt, i) => (
              <span key={`${i}-${opt}`}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium border-2",
                  selected.includes(opt)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-muted/30 border-border text-muted-foreground",
                )}>
                {selected.includes(opt) && <span className="mr-1 text-xs">✓</span>}
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
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt, i) => (
              <button
                key={`${i}-${opt}`}
                type="button"
                onClick={() => onChange(strVal === opt ? "" : opt)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium border-2 transition-all duration-150",
                  strVal === opt
                    ? "bg-primary border-primary text-white shadow-sm"
                    : "bg-white border-border text-foreground hover:border-primary/60 hover:bg-primary/5",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );

    case "checkbox": {
      const hasOpts = (field.options?.length ?? 0) > 0;
      if (!hasOpts) {
        const checked = value === true || value === "true";
        return (
          <button
            type="button"
            onClick={() => onChange(!checked)}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border-2 text-sm font-medium transition-all duration-150",
              checked
                ? "bg-primary/10 border-primary text-primary"
                : "bg-white border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
            )}
          >
            <div className={cn(
              "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
              checked ? "border-primary bg-primary" : "border-muted-foreground",
            )}>
              {checked && <span className="text-white text-[10px] leading-none">✓</span>}
            </div>
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </button>
        );
      }
      // Multi-select — pill toggle buttons
      const selected = strVal ? strVal.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const toggleOpt = (opt: string) => {
        const next = selected.includes(opt)
          ? selected.filter((s) => s !== opt)
          : [...selected, opt];
        onChange(next.join(","));
      };
      return (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt, i) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={`${i}-${opt}`}
                  type="button"
                  onClick={() => toggleOpt(opt)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-sm font-medium border-2 transition-all duration-150",
                    active
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-white border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
                  )}
                >
                  {active && <span className="mr-1 text-xs">✓</span>}
                  {opt}
                </button>
              );
            })}
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

  const filledCount = section.fields?.filter(
    (f) => sectionNotes[f.id] != null && sectionNotes[f.id] !== "",
  ).length ?? 0;
  const totalCount = section.fields?.filter((f) => f.type !== "separator").length ?? 0;
  const hasData = filledCount > 0;

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-all duration-150",
      open ? "border-primary/30 shadow-sm" : "border-border",
    )}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors",
          open ? "bg-primary/5 hover:bg-primary/8" : "bg-card hover:bg-muted/30",
        )}
      >
        <div className="flex items-center gap-3">
          {/* filled indicator */}
          <div className={cn(
            "h-2 w-2 rounded-full shrink-0 transition-colors",
            hasData ? "bg-primary" : "bg-border",
          )} />
          <span className={cn("text-sm font-semibold", open && "text-primary")}>
            {section.name}
          </span>
          {/* fill count badge */}
          {totalCount > 0 && (
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              hasData ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}>
              {filledCount}/{totalCount}
            </span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          open ? "rotate-180 text-primary" : "text-muted-foreground",
        )} />
      </button>

      {/* Content */}
      {open && (
        <div className="px-5 py-5 border-t border-border bg-white">
          {section.type === "vitals" ? (
            <PatientVitals patientId={patientId} />
          ) : section.fields && section.fields.length > 0 ? (
            <div className="space-y-5">
              {section.fields.map((field) => (
                <div key={field.id}
                  className={field.type === "separator" ? "col-span-full" : ""}
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

/* ─── Print visit ────────────────────────────────────────────────────── */
function printVisit(params: {
  visit: import("@his/shared").Visit;
  patientName: string;
  patientCode: string;
  notes: string;
  templateTabs: EmrTabConfig[];
  clinicalNotes: Record<string, Record<string, string | number | boolean>>;
  printConfig?: import("@his/shared").PrintConfig;
  patientRaw?: import("@/lib/print-utils").PrintPatientInfo;
}) {
  const { visit, patientName, patientCode, notes, templateTabs, clinicalNotes, printConfig } = params;

  const c = cfg(printConfig);
  const visitTypeLabel = visit.visitType
    ? APPOINTMENT_TYPE_LABELS_MN[visit.visitType as AppointmentType]
    : "";
  const patientBlock = params.patientRaw
    ? buildPatientMeta(params.patientRaw, c)
    : `<div class="p-meta">
        <div class="p-meta-block"><span>Өвчтөн</span><strong>${patientName}</strong></div>
        <div class="p-meta-block"><span>Код</span><strong style="font-family:monospace">${patientCode}</strong></div>
        <div class="p-meta-block"><span>Эмч</span><strong>${visit.doctorName}</strong></div>
        ${visitTypeLabel ? `<div class="p-meta-block"><span>Үзлэгийн төрөл</span><strong>${visitTypeLabel}</strong></div>` : ""}
        <div class="p-meta-block" style="text-align:right"><span>Огноо</span><strong>${new Date(visit.visitDate).toLocaleString("mn-MN")}</strong></div>
       </div>`;

  const basicFields = [
    { label: "Тэмдэглэл", value: notes },
  ].filter((f) => f.value);

  const basicHtml = basicFields.map((f) => `
    <tr>
      <td style="padding:7px 12px;font-size:12px;color:#64748b;width:130px;vertical-align:top;white-space:nowrap">${f.label}</td>
      <td style="padding:7px 12px;font-size:13px;white-space:pre-wrap">${f.value}</td>
    </tr>
  `).join("");

  const tabsHtml = templateTabs.map((tab) => {
    const sectionsHtml = tab.sections
      .slice()
      .sort((a, b) => {
        if (a.type === "vitals" && b.type !== "vitals") return 1;
        if (a.type !== "vitals" && b.type === "vitals") return -1;
        return a.order - b.order;
      })
      .map((section) => {
        if (section.type === "vitals") return "";
        const sectionNotes = clinicalNotes[section.id] ?? {};
        const hasData = section.fields?.some((f) => sectionNotes[f.id] != null && sectionNotes[f.id] !== "");
        if (!hasData) return "";
        const fieldsHtml = (section.fields ?? []).map((field) => {
          const val = sectionNotes[field.id];
          if (val == null || val === "") return "";
          if (field.type === "separator") return `<tr><td colspan="2" style="padding:4px 12px"><hr style="border:none;border-top:1px solid #e2e8f0"/></td></tr>`;
          return `<tr>
            <td style="padding:5px 12px;font-size:11px;color:#64748b;width:130px;vertical-align:top">${field.label}</td>
            <td style="padding:5px 12px;font-size:12px">${String(val)}</td>
          </tr>`;
        }).join("");
        return `
          <div style="margin-bottom:12px">
            <div style="font-size:12px;font-weight:700;color:#475569;padding:5px 12px;background:#f1f5f9;border-radius:4px;margin-bottom:4px">${section.name}</div>
            <table style="width:100%;border-collapse:collapse">${fieldsHtml}</table>
          </div>`;
      }).join("");
    if (!sectionsHtml) return "";
    return `<div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:700;border-bottom:2px solid #1e293b;padding-bottom:4px;margin-bottom:10px">${tab.name}</div>
      ${sectionsHtml}
    </div>`;
  }).join("");

  openPrintWindow("Үзлэгийн карт", "ҮЗЛЭГИЙН КАРТ / EMR VISIT", `
    ${patientBlock}
    <div class="p-meta" style="margin-bottom:12px">
      <div class="p-meta-block"><span>Эмч</span><strong>${visit.doctorName}</strong></div>
      ${visitTypeLabel ? `<div class="p-meta-block"><span>Үзлэгийн төрөл</span><strong style="color:#1d4ed8">${visitTypeLabel}</strong></div>` : ""}
      <div class="p-meta-block" style="text-align:right"><span>Огноо</span><strong>${new Date(visit.visitDate).toLocaleString("mn-MN")}</strong></div>
    </div>
    ${basicFields.length > 0 ? `
    <div style="margin-bottom:20px">
      <div style="font-size:14px;font-weight:700;border-bottom:2px solid #1e293b;padding-bottom:4px;margin-bottom:8px">Үзлэгийн мэдээлэл</div>
      <table><tbody>${basicHtml}</tbody></table>
    </div>` : ""}
    ${tabsHtml}
  `, printConfig);
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
  const [notes, setNotes] = useState("");

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

  const { data: printConfig } = useQuery({
    queryKey: ["print-config"],
    queryFn: getPrintConfig,
    staleTime: 5 * 60_000,
  });

  const templateTabs: EmrTabConfig[] = templateQuery.data?.tabs ?? [];

  /* Populate form once when visit data arrives */
  useEffect(() => {
    if (existingVisit.data && !populated.current) {
      populated.current = true;
      const v = existingVisit.data;
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
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appt-calendar"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
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
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">Үзлэгийн карт</h1>
              {visit?.visitType && (
                <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {APPOINTMENT_TYPE_LABELS_MN[visit.visitType as AppointmentType]}
                </span>
              )}
            </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                printVisit({
                  visit,
                  patientName: patient.data
                    ? `${patient.data.lastName} ${patient.data.firstName}`
                    : "",
                  patientCode: patient.data?.patientCode ?? "",
                  notes,
                  templateTabs,
                  clinicalNotes,
                  printConfig,
                  patientRaw: patient.data ? {
                    name: `${patient.data.lastName} ${patient.data.firstName}`,
                    patientCode: patient.data.patientCode,
                    registerNumber: patient.data.registerNumber,
                    birthDate: patient.data.birthDate,
                    gender: patient.data.gender,
                    phone: patient.data.phone,
                    address: patient.data.address,
                    bloodType: patient.data.bloodType,
                    attendingDoctorName: patient.data.attendingDoctorName,
                  } : undefined,
                })
              }
            >
              <Printer className="h-4 w-4" />
              Хэвлэх
            </Button>
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
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Тэмдэглэл</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <Textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Үзлэгийн тэмдэглэл..."
                />
              ) : (
                <ReadField label="" value={notes} />
              )}
            </CardContent>
          </Card>

          {/* Treatment — integrated module */}
          <PatientTreatment patientId={patientId} defaultOpen />
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
