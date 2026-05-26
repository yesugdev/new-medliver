"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Plus, Save, Trash2, CheckCircle2, Lock, User as UserIcon, ArrowLeft,
} from "lucide-react";
import type { Prescription } from "@his/shared";
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
import { getPatient } from "@/lib/patients-api";
import { extractApiError } from "@/lib/api";
import { formatDateTimeMn } from "@/lib/utils";
import { VISIT_TONE } from "@/lib/status-tones";

/* ─── Read-only field ────────────────────────────────────────────────── */
function ReadField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="min-h-[2.5rem] rounded-md border border-border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">
        {value || <span className="text-muted-foreground italic">—</span>}
      </div>
    </div>
  );
}

function VisitForm() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const patientId     = params.get("patientId") ?? "";
  const appointmentId = params.get("appointmentId") ?? undefined;
  const visitIdParam  = params.get("visitId") ?? "";

  const [visitId, setVisitId] = useState(visitIdParam);

  /* Form state */
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms,       setSymptoms]       = useState("");
  const [diagnosis,      setDiagnosis]      = useState("");
  const [treatment,      setTreatment]      = useState("");
  const [notes,          setNotes]          = useState("");
  const [prescriptions,  setPrescriptions]  = useState<Prescription[]>([]);
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

  /* Populate form once when visit data arrives */
  useEffect(() => {
    if (existingVisit.data && !populated.current) {
      populated.current = true;
      const v = existingVisit.data;
      setChiefComplaint(v.chiefComplaint ?? "");
      setSymptoms(v.symptoms ?? "");
      setDiagnosis(v.diagnosis ?? "");
      setTreatment(v.treatment ?? "");
      setNotes(v.notes ?? "");
      setPrescriptions(v.prescriptions ?? []);
    }
  }, [existingVisit.data]);

  /* Reset populated flag when visitId changes (navigating to different visit) */
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
  }, [patientId, visitId, ensureVisit]);

  /* ── Ownership / edit permission ──────────────────────────────────── */
  const visit = existingVisit.data;
  const canEdit =
    Boolean(user) &&
    Boolean(visit) &&
    (user!.role === "admin" || user!.id === visit!.doctorId);

  /* ── Save mutation ────────────────────────────────────────────────── */
  const save = useMutation({
    mutationFn: (status?: "completed") =>
      updateVisit(visitId, {
        chiefComplaint,
        symptoms,
        diagnosis,
        treatment,
        notes,
        prescriptions,
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

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0"
            onClick={() => patientId ? router.push(`/patients/${patientId}`) : router.back()}>
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

      {/* Doctor info + ownership notice */}
      {visit && (
        <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm border ${
          canEdit
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          {canEdit
            ? <UserIcon className="h-4 w-4 shrink-0" />
            : <Lock className="h-4 w-4 shrink-0" />}
          <span>
            <strong>Эмч:</strong> {visit.doctorName}
            {!canEdit && (
              <span className="ml-2 opacity-80">— Зөвхөн тухайн эмч засах боломжтой</span>
            )}
          </span>
        </div>
      )}

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
                <Textarea rows={2} value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Шинж тэмдэг</Label>
                <Textarea rows={3} value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Онош</Label>
                <Textarea rows={2} value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Эмчилгээ</Label>
                <Textarea rows={3} value={treatment}
                  onChange={(e) => setTreatment(e.target.value)} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadField label="Зовиур"     value={chiefComplaint} />
              <ReadField label="Шинж тэмдэг" value={symptoms} />
              <ReadField label="Онош"        value={diagnosis} />
              <ReadField label="Эмчилгээ"    value={treatment} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Эмийн жор</CardTitle>
          {canEdit && (
            <Button variant="outline" size="sm"
              onClick={() => setPrescriptions([
                ...prescriptions,
                { medication: "", dosage: "", frequency: "", duration: "" },
              ])}>
              <Plus className="h-4 w-4" />
              Жор нэмэх
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {prescriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Жор нэмээгүй</p>
          ) : canEdit ? (
            prescriptions.map((p, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start border rounded-md p-3">
                <div className="col-span-12 md:col-span-3">
                  <Label className="text-xs">Эмийн нэр</Label>
                  <Input value={p.medication}
                    onChange={(e) => { const n=[...prescriptions]; n[idx]={...n[idx],medication:e.target.value}; setPrescriptions(n); }} />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <Label className="text-xs">Тун</Label>
                  <Input placeholder="500мг" value={p.dosage}
                    onChange={(e) => { const n=[...prescriptions]; n[idx]={...n[idx],dosage:e.target.value}; setPrescriptions(n); }} />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <Label className="text-xs">Давтамж</Label>
                  <Input placeholder="3 удаа" value={p.frequency}
                    onChange={(e) => { const n=[...prescriptions]; n[idx]={...n[idx],frequency:e.target.value}; setPrescriptions(n); }} />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <Label className="text-xs">Хугацаа</Label>
                  <Input placeholder="7 хоног" value={p.duration}
                    onChange={(e) => { const n=[...prescriptions]; n[idx]={...n[idx],duration:e.target.value}; setPrescriptions(n); }} />
                </div>
                <div className="col-span-5 md:col-span-2">
                  <Label className="text-xs">Заавар</Label>
                  <Input value={p.instructions ?? ""}
                    onChange={(e) => { const n=[...prescriptions]; n[idx]={...n[idx],instructions:e.target.value}; setPrescriptions(n); }} />
                </div>
                <div className="col-span-1 flex items-end justify-end pt-5">
                  <Button variant="ghost" size="icon"
                    onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            /* Read-only prescription list */
            <div className="space-y-2">
              {prescriptions.map((p, idx) => (
                <div key={idx} className="rounded-md border border-border bg-muted/20 px-4 py-2.5 text-sm">
                  <span className="font-medium">{p.medication}</span>
                  {p.dosage && <span className="ml-2 text-muted-foreground">{p.dosage}</span>}
                  {p.frequency && <span className="ml-2">· {p.frequency}</span>}
                  {p.duration && <span className="ml-2">· {p.duration}</span>}
                  {p.instructions && (
                    <div className="text-xs text-muted-foreground mt-0.5">{p.instructions}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>Тэмдэглэл</CardTitle></CardHeader>
        <CardContent>
          {canEdit ? (
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          ) : (
            <ReadField label="" value={notes} />
          )}
        </CardContent>
      </Card>

      {/* Action buttons — only for the owning doctor */}
      {canEdit && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => save.mutate(undefined)} disabled={save.isPending}>
            <Save className="h-4 w-4" />
            Хадгалах
          </Button>
          {visit?.status !== "completed" && (
            <Button onClick={() => save.mutate("completed")} disabled={save.isPending}>
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
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    }>
      <VisitForm />
    </Suspense>
  );
}
