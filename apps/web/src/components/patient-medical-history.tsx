"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown, ChevronUp, Plus, X, Trash2, Loader2,
  ClipboardList, CalendarDays, MapPin, FlaskConical,
  Activity, User,
} from "lucide-react";
import type { MedicalHistoryRecord } from "@his/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import {
  createMedicalHistory,
  deleteMedicalHistory,
  listMedicalHistory,
} from "@/lib/medical-history-api";
import { extractApiError } from "@/lib/api";
import { formatDateTimeMn } from "@/lib/utils";

/* ─── Tag input ─────────────────────────────────────────────────── */
function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder?: string;
  tags: string[];
  onChange: (t: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v || tags.includes(v)) return;
    onChange([...tags, v]);
    setInput("");
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="min-h-[2.25rem] flex flex-wrap gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5">
        {tags.map((t, i) => (
          <span key={i}
            className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {t}
            <button onClick={() => onChange(tags.filter((_, j) => j !== i))} type="button">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">Enter эсвэл таслал дарж нэмнэ</p>
    </div>
  );
}

/* ─── View: single record card ──────────────────────────────────── */
function HistoryCard({
  record,
  patientId,
  canDelete,
}: {
  record: MedicalHistoryRecord;
  patientId: string;
  canDelete: boolean;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: () => deleteMedicalHistory(patientId, record.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-history", patientId] });
      toast({ title: "Устгагдлаа", variant: "success" });
    },
    onError: (e) => toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const TREATMENT_LABELS: Record<string, string> = {
    medication:     "Эмийн эмчилгээ",
    non_medication: "Эмийн бус эмчилгээ",
    none:           "Эмчилгээ хийлгээгүй",
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">
            {record.diagnoses.length > 0
              ? record.diagnoses.join(", ")
              : record.symptoms.length > 0
              ? record.symptoms.join(", ")
              : "Өвчний түүх"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />{record.recordedByName}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />{formatDateTimeMn(record.createdAt)}
            </span>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
               : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
            {record.symptoms.length > 0 && (
              <InfoBlock label="Илэрсэн зовиур">
                <TagDisplay items={record.symptoms} color="blue" />
              </InfoBlock>
            )}
            {record.diagnoses.length > 0 && (
              <InfoBlock label="Илэрсэн онош">
                <TagDisplay items={record.diagnoses} color="purple" />
              </InfoBlock>
            )}
            {record.diagnosedAt && (
              <InfoBlock label="Анх оношлогдсон огноо">
                <span className="text-sm">{record.diagnosedAt}</span>
              </InfoBlock>
            )}
            {record.diagnosedWhere && (
              <InfoBlock label="Анх хаана оношлогдсон бэ?">
                <span className="text-sm">{record.diagnosedWhere}</span>
              </InfoBlock>
            )}
            {record.previousClinic && (
              <InfoBlock label="Өмнө хаана үзүүлсэн бэ?">
                <span className="text-sm">{record.previousClinic}</span>
              </InfoBlock>
            )}
            {record.treatmentTypes.length > 0 && (
              <InfoBlock label="Хийлгэсэн эмчилгээ">
                <TagDisplay
                  items={record.treatmentTypes.map((t) => TREATMENT_LABELS[t] ?? t)}
                  color="green"
                />
              </InfoBlock>
            )}
            {record.treatmentResult && (
              <InfoBlock label="Эмчилгээний үр дүн" wide>
                <span className="text-sm">{record.treatmentResult}</span>
              </InfoBlock>
            )}
            {record.diseaseDuration !== undefined && (
              <InfoBlock label="Өвчний үргэлжилсэн хугацаа">
                <span className="text-sm">{record.diseaseDuration} жил</span>
              </InfoBlock>
            )}
            {record.diseaseStartCause && (
              <InfoBlock label="Өвчний эхлэлтэй холбоотой шалтгаан" wide>
                <span className="text-sm">{record.diseaseStartCause}</span>
              </InfoBlock>
            )}
            {record.testsPerformed && (
              <InfoBlock label="Хийлгэсэн шинжилгээ" wide>
                <span className="text-sm">{record.testsPerformed}</span>
              </InfoBlock>
            )}
            {record.progressBeforeAdmission && (
              <InfoBlock label="Ирэх хүртэлх өвчний явц" wide>
                <span className="text-sm">{record.progressBeforeAdmission}</span>
              </InfoBlock>
            )}
            {record.initialSymptoms && (
              <InfoBlock label="Анх илэрсэн зовиур" wide>
                <span className="text-sm">{record.initialSymptoms}</span>
              </InfoBlock>
            )}
            {record.annualFlareCount !== undefined && (
              <InfoBlock label="Жилийн сэдрэлийн тоо">
                <span className="text-sm">{record.annualFlareCount} удаа</span>
              </InfoBlock>
            )}
            {record.flaresCause && (
              <InfoBlock label="Сэдрэлийн шалтгаан" wide>
                <span className="text-sm">{record.flaresCause}</span>
              </InfoBlock>
            )}
            {record.flaresPrevention && (
              <InfoBlock label="Сэдрэлийн урьдчилан сэргийлэлт" wide>
                <span className="text-sm">{record.flaresPrevention}</span>
              </InfoBlock>
            )}
            {record.additionalInfo && (
              <InfoBlock label="Нэмэлт мэдээлэл" wide>
                <span className="text-sm">{record.additionalInfo}</span>
              </InfoBlock>
            )}
          </div>

          {canDelete && (
            <div className="flex justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => del.mutate()}
                disabled={del.isPending}
                className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
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

function InfoBlock({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}

function TagDisplay({
  items,
  color,
}: {
  items: string[];
  color: "blue" | "purple" | "green";
}) {
  const cls = {
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[color];

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

/* ─── Add form ──────────────────────────────────────────────────── */
function AddHistoryForm({
  patientId,
  onSaved,
}: {
  patientId: string;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [symptoms,             setSymptoms]             = useState<string[]>([]);
  const [diagnoses,            setDiagnoses]            = useState<string[]>([]);
  const [diagnosedAt,          setDiagnosedAt]          = useState("");
  const [diagnosedWhere,       setDiagnosedWhere]       = useState("");
  const [previousClinic,       setPreviousClinic]       = useState("");
  const [treatmentTypes,       setTreatmentTypes]       = useState<string[]>([]);
  const [treatmentResult,      setTreatmentResult]      = useState("");
  const [diseaseDuration,      setDiseaseDuration]      = useState("");
  const [diseaseStartCause,    setDiseaseStartCause]    = useState("");
  const [testsPerformed,       setTestsPerformed]       = useState("");
  const [progressBeforeAdm,    setProgressBeforeAdm]    = useState("");
  const [initialSymptoms,      setInitialSymptoms]      = useState("");
  const [annualFlareCount,     setAnnualFlareCount]     = useState("");
  const [flaresCause,          setFlaresCause]          = useState("");
  const [flaresPrevention,     setFlaresPrevention]     = useState("");
  const [additionalInfo,       setAdditionalInfo]       = useState("");

  const toggleTreatment = (val: string) =>
    setTreatmentTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );

  const save = useMutation({
    mutationFn: () =>
      createMedicalHistory(patientId, {
        symptoms,
        diagnoses,
        diagnosedAt:           diagnosedAt     || undefined,
        diagnosedWhere:        diagnosedWhere  || undefined,
        previousClinic:        previousClinic  || undefined,
        treatmentTypes,
        treatmentResult:       treatmentResult       || undefined,
        diseaseDuration:       diseaseDuration       ? Number(diseaseDuration)   : undefined,
        diseaseStartCause:     diseaseStartCause     || undefined,
        testsPerformed:        testsPerformed        || undefined,
        progressBeforeAdmission: progressBeforeAdm  || undefined,
        initialSymptoms:       initialSymptoms       || undefined,
        annualFlareCount:      annualFlareCount      ? Number(annualFlareCount)  : undefined,
        flaresCause:           flaresCause           || undefined,
        flaresPrevention:      flaresPrevention      || undefined,
        additionalInfo:        additionalInfo        || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Өвчний түүх хадгалагдлаа", variant: "success" });
      qc.invalidateQueries({ queryKey: ["medical-history", patientId] });
      onSaved();
    },
    onError: (e) =>
      toast({ title: "Алдаа", description: extractApiError(e), variant: "destructive" }),
  });

  const F = "space-y-1.5";
  const inp = "h-9 text-sm";
  const ta  = "text-sm resize-none";

  return (
    <div className="space-y-5">
      {/* Зовиур & онош */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TagInput
          label="Илэрсэн зовуурийг сонгоно уу"
          placeholder="Зовиур оруулаад Enter дарна уу..."
          tags={symptoms}
          onChange={setSymptoms}
        />
        <TagInput
          label="Илэрсэн оношийг сонгоно уу"
          placeholder="Онош оруулаад Enter дарна уу..."
          tags={diagnoses}
          onChange={setDiagnoses}
        />
      </div>

      {/* Оношилгооны мэдээлэл */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={F}>
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            Анх хэзээ оношлогдсон бэ?
          </Label>
          <Input
            type="date"
            value={diagnosedAt}
            onChange={(e) => setDiagnosedAt(e.target.value)}
            className={inp}
          />
        </div>
        <div className={F}>
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Анх хаана оношлогдсон бэ?
          </Label>
          <Input
            value={diagnosedWhere}
            onChange={(e) => setDiagnosedWhere(e.target.value)}
            placeholder="Эмнэлэг, эмч..."
            className={inp}
          />
        </div>
        <div className={`${F} md:col-span-2`}>
          <Label className="text-xs font-medium">
            Энд ирэхээс өмнө хаана үзүүлсэн бэ?
          </Label>
          <Input
            value={previousClinic}
            onChange={(e) => setPreviousClinic(e.target.value)}
            placeholder="Эмнэлэг, клиник..."
            className={inp}
          />
        </div>
      </div>

      {/* Эмчилгээний төрөл */}
      <div className={F}>
        <Label className="text-xs font-medium">Ямар эмчилгээ хийлгэсэн бэ?</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {[
            { val: "medication",     label: "Эмийн эмчилгээ"        },
            { val: "non_medication", label: "Эмийн бус эмчилгээ"    },
            { val: "none",           label: "Эмчилгээ хийлгээгүй"   },
          ].map(({ val, label }) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={treatmentTypes.includes(val)}
                onChange={() => toggleTreatment(val)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={F}>
        <Label className="text-xs font-medium">Эмчилгээний үр дүн ямар байсан бэ?</Label>
        <Textarea
          rows={2}
          value={treatmentResult}
          onChange={(e) => setTreatmentResult(e.target.value)}
          placeholder="Бичнэ үү..."
          className={ta}
        />
      </div>

      {/* Өвчний эхлэл */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={F}>
          <Label className="text-xs font-medium">Өвчин хэзээ эхэлсэн бэ? <span className="text-muted-foreground font-normal">(жилийн тоо)</span></Label>
          <Input
            type="number"
            min={0}
            value={diseaseDuration}
            onChange={(e) => setDiseaseDuration(e.target.value)}
            placeholder="Тоо оруулна уу"
            className={inp}
          />
        </div>
        <div className={F}>
          <Label className="text-xs font-medium">Жилд хэдэн удаа сэдэрдэг вэ?</Label>
          <Input
            type="number"
            min={0}
            value={annualFlareCount}
            onChange={(e) => setAnnualFlareCount(e.target.value)}
            placeholder="Тоо оруулна уу"
            className={inp}
          />
        </div>
      </div>

      <div className={F}>
        <Label className="text-xs font-medium">Өвчний эхлэлийг юутай холбоотой гэж бодож байна вэ?</Label>
        <Textarea
          rows={2}
          value={diseaseStartCause}
          onChange={(e) => setDiseaseStartCause(e.target.value)}
          placeholder="Бичнэ үү..."
          className={ta}
        />
      </div>

      {/* Шинжилгээ & явц */}
      <div className={F}>
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
          Ямар шинжилгээ хийлгэсэн бэ?
        </Label>
        <Textarea
          rows={2}
          value={testsPerformed}
          onChange={(e) => setTestsPerformed(e.target.value)}
          placeholder="Бичнэ үү..."
          className={ta}
        />
      </div>

      <div className={F}>
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          Эмнэлэгт ирэх хүртэл өвчний явц ямар байсан бэ?
        </Label>
        <Textarea
          rows={2}
          value={progressBeforeAdm}
          onChange={(e) => setProgressBeforeAdm(e.target.value)}
          placeholder="Бичнэ үү..."
          className={ta}
        />
      </div>

      <div className={F}>
        <Label className="text-xs font-medium">Анх ямар зовууриар илэрсэн бэ?</Label>
        <Textarea
          rows={2}
          value={initialSymptoms}
          onChange={(e) => setInitialSymptoms(e.target.value)}
          placeholder="Бичнэ үү..."
          className={ta}
        />
      </div>

      {/* Сэдрэл */}
      <div className={F}>
        <Label className="text-xs font-medium">Өвчний сэдрэлийг юутай холбоотой гэж боддог вэ?</Label>
        <Textarea
          rows={2}
          value={flaresCause}
          onChange={(e) => setFlaresCause(e.target.value)}
          placeholder="Бичнэ үү..."
          className={ta}
        />
      </div>

      <div className={F}>
        <Label className="text-xs font-medium">Сэдрэлээс урьдчилан сэргийлэх ямар арга хэмжээ авдаг вэ?</Label>
        <Textarea
          rows={2}
          value={flaresPrevention}
          onChange={(e) => setFlaresPrevention(e.target.value)}
          placeholder="Бичнэ үү..."
          className={ta}
        />
      </div>

      {/* Нэмэлт */}
      <div className={F}>
        <Label className="text-xs font-medium">Нэмэлт мэдээлэл</Label>
        <Textarea
          rows={3}
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Бичнэ үү..."
          className={ta}
        />
      </div>

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

/* ─── Main component ─────────────────────────────────────────────── */
export function PatientMedicalHistory({ patientId }: { patientId: string }) {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  const canAdd    = user && ["admin", "doctor", "nurse"].includes(user.role);
  const canDelete = user && ["admin", "doctor"].includes(user.role);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["medical-history", patientId],
    queryFn: () => listMedicalHistory(patientId),
    enabled: open,
  });

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* ── Accordion header ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <ClipboardList className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <span className="text-base font-semibold">Өвчний түүх</span>
          {!open && records.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">{records.length} бүртгэл</span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
      </button>

      {/* ── Accordion body ───────────────────────────────────────── */}
      {open && (
        <div className="border-t border-border">
          {/* Tab bar */}
          <div className="flex border-b border-border px-1 bg-muted/10">
            {[
              { key: "list", label: "Өвчний түүх" },
              ...(canAdd ? [{ key: "add", label: "Өвчний түүх нэмэх" }] : []),
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
                  <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-25" />
                  <p className="text-sm">Өвчний түүх бүртгэгдээгүй байна.</p>
                  {canAdd && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("add")}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      + Өвчний түүх нэмэх
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((r) => (
                    <HistoryCard
                      key={r.id}
                      record={r}
                      patientId={patientId}
                      canDelete={!!canDelete}
                    />
                  ))}
                </div>
              )
            ) : (
              <AddHistoryForm
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
