"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Upload, AlertCircle, FileText, Download, Eye, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import {
  INSTRUMENTAL_EXAM_LABELS,
  INSTRUMENTAL_EXAM_TYPES,
  type InstrumentalExamType,
} from "@his/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getExamResults, createExamResult, deleteExamResult,
  getExamFiles,   createExamFile,   deleteExamFile,
} from "@/lib/instrumental-exams-api";

/* ─── Helpers ────────────────────────────────────────────────────── */

const today = () => new Date().toISOString().slice(0, 10);

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" }); }
  catch { return iso; }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function downloadFile(fileName: string, mimeType: string, base64: string) {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${base64}`;
  link.download = fileName;
  link.click();
}

function dataUrl(mimeType: string, base64: string) {
  return `data:${mimeType};base64,${base64}`;
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isPdf(mimeType: string) {
  return mimeType === "application/pdf";
}

/* ─── Preview modal ──────────────────────────────────────────────── */

interface PreviewFile {
  fileName: string;
  mimeType: string;
  fileData: string;
}

function FilePreviewModal({ file, onClose }: { file: PreviewFile; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const src = dataUrl(file.mimeType, file.fileData);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex flex-col bg-background rounded-xl shadow-2xl max-w-5xl w-full mx-4 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">{file.fileName}</span>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {isImage(file.mimeType) && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} title="Жижрүүлэх">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(4, z + 0.25))} title="Томруулах">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRotate((r) => (r + 90) % 360)} title="Эргүүлэх">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border mx-1" />
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadFile(file.fileName, file.mimeType, file.fileData)} title="Татах">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Хаах">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 min-h-0">
          {isImage(file.mimeType) && (
            <div className="p-4">
              <img
                src={src}
                alt={file.fileName}
                style={{ transform: `scale(${zoom}) rotate(${rotate}deg)`, transformOrigin: "center", transition: "transform 0.2s" }}
                className="max-w-full block rounded shadow"
              />
            </div>
          )}
          {isPdf(file.mimeType) && (
            <iframe
              src={src}
              title={file.fileName}
              className="w-full h-full min-h-[70vh]"
              style={{ border: "none" }}
            />
          )}
          {!isImage(file.mimeType) && !isPdf(file.mimeType) && (
            <div className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
              <FileText className="h-16 w-16 opacity-30" />
              <p className="text-sm">Энэ файлын урьдчилан харах боломжгүй.</p>
              <Button onClick={() => downloadFile(file.fileName, file.mimeType, file.fileData)}>
                <Download className="h-4 w-4" /> Татаж авах
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Exam type tabs ─────────────────────────────────────────────── */

function ExamTabs({ active, onChange }: { active: InstrumentalExamType; onChange: (t: InstrumentalExamType) => void }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-2 mb-4">
      {INSTRUMENTAL_EXAM_TYPES.map((t) => (
        <button key={t} type="button" onClick={() => onChange(t)}
          className={cn("px-3 py-1.5 text-xs font-medium rounded transition-colors",
            active === t ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>
          {INSTRUMENTAL_EXAM_LABELS[t]}
        </button>
      ))}
    </div>
  );
}

/* ─── Results section (top table) ───────────────────────────────── */

function ResultsSection({ patientId, examType }: { patientId: string; examType: InstrumentalExamType }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(today());
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");

  const key = ["exam-results", patientId, examType];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => getExamResults(patientId, examType) });

  const addMut = useMutation({
    mutationFn: () => createExamResult(patientId, { examType, date, result, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      setResult(""); setNotes(""); setDate(today()); setShowForm(false);
    },
  });

  const delMut = useMutation({
    mutationFn: (rid: string) => deleteExamResult(patientId, rid),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Шинжилгээний хариу</span>
        <Button size="sm" className="bg-destructive hover:bg-destructive/90 h-7 text-xs px-3"
          onClick={() => setShowForm((v) => !v)}>
          Хариу оруулах
        </Button>
      </div>

      {/* Add result form */}
      {showForm && (
        <div className="mb-3 rounded border border-border bg-muted/20 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Огноо</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full h-8 mt-1 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Үйлдэл / Хариу</label>
              <input type="text" value={result} onChange={(e) => setResult(e.target.value)}
                placeholder="Шинжилгээний хариу..."
                className="w-full h-8 mt-1 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Тэмдэглэл (заавал биш)"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Болих</Button>
            <Button size="sm" onClick={() => addMut.mutate()} disabled={addMut.isPending || !result.trim()}>
              {addMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Хадгалах
            </Button>
          </div>
        </div>
      )}

      {/* Results table */}
      <div className="overflow-x-auto border border-border rounded">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/60">
              {["ОГНОО", "ХАРИУ", "ТЭМДЭГЛЭЛ", "ЭМЧ", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-xs font-semibold text-center text-muted-foreground border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="py-6 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" /></td></tr>
            )}
            {!isLoading && !data?.length && (
              <tr><td colSpan={5} className="py-8 text-center">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" /><span className="text-xs">Мэдээлэл байхгүй байна</span>
                </div>
              </td></tr>
            )}
            {data?.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2 text-center whitespace-nowrap text-muted-foreground text-xs">{formatDate(r.date)}</td>
                <td className="px-3 py-2 font-medium">{r.result}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{r.notes}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{r.recordedByName}</td>
                <td className="px-3 py-2 text-center">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                    onClick={() => delMut.mutate(r.id)} disabled={delMut.isPending}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Files section (middle table + upload form) ─────────────────── */

const MAX_FILE_MB = 8;

function FilesSection({ patientId, examType }: { patientId: string; examType: InstrumentalExamType }) {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; size: number; type: string; base64: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today());
  const [sizeError, setSizeError] = useState("");
  const [preview, setPreview] = useState<PreviewFile | null>(null);

  const key = ["exam-files", patientId, examType];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => getExamFiles(patientId, examType) });

  const addMut = useMutation({
    mutationFn: () => createExamFile(patientId, {
      examType, date,
      fileName: pending!.name,
      fileSize: pending!.size,
      mimeType: pending!.type,
      fileData: pending!.base64,
      notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      setPending(null); setNotes(""); setDate(today());
      if (fileInput.current) fileInput.current.value = "";
    },
  });

  const delMut = useMutation({
    mutationFn: (fid: string) => deleteExamFile(patientId, fid),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSizeError("");
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setSizeError(`Файлын хэмжээ ${MAX_FILE_MB}MB-аас бага байх ёстой`);
      return;
    }
    const base64 = await readFileAsBase64(file);
    setPending({ name: file.name, size: file.size, type: file.type || "application/octet-stream", base64 });
  };

  return (
    <div className="space-y-4">
      {/* Files table */}
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Файлууд</div>
        <div className="overflow-x-auto border border-border rounded">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/60">
                {["ФАЙЛЫН НЭР", "ФАЙЛЫН ХЭМЖЭЭ", "ОГНОО", "ҮЙЛДЭЛ", "ТАЙЛБАР"].map((h) => (
                  <th key={h} className="px-3 py-2 text-xs font-semibold text-center text-muted-foreground border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="py-6 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" /></td></tr>
              )}
              {!isLoading && !data?.length && (
                <tr><td colSpan={5} className="py-8 text-center">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" /><span className="text-xs">Мэдээлэл байхгүй байна</span>
                  </div>
                </td></tr>
              )}
              {data?.map((f) => (
                <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => downloadFile(f.fileName, f.mimeType, f.fileData)}
                      className="flex items-center gap-1.5 text-primary hover:underline text-sm">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {f.fileName}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground whitespace-nowrap">{formatBytes(f.fileSize)}</td>
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground whitespace-nowrap">{formatDate(f.date)}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary"
                        onClick={() => setPreview({ fileName: f.fileName, mimeType: f.mimeType, fileData: f.fileData })} title="Урьдчилан харах">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary"
                        onClick={() => downloadFile(f.fileName, f.mimeType, f.fileData)} title="Татах">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                        onClick={() => delMut.mutate(f.id)} disabled={delMut.isPending}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{f.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload form */}
      <div className="rounded border border-border bg-muted/10 p-4 space-y-3">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Файл нэмэх</div>

        <div className="grid grid-cols-2 gap-3">
          {/* File picker */}
          <div>
            <label className="text-xs text-muted-foreground">Файл нэмэх</label>
            <div className="mt-1">
              <input ref={fileInput} type="file" className="hidden" onChange={handleFileChange}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" />
              {pending ? (
                <div className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{pending.name}</div>
                    <div className="text-xs text-muted-foreground">{formatBytes(pending.size)}</div>
                  </div>
                  <button type="button" onClick={() => { setPending(null); if (fileInput.current) fileInput.current.value = ""; }}
                    className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInput.current?.click()}
                  className="w-full h-16 rounded border-2 border-dashed border-border hover:border-primary/50 bg-background flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-xs">Файл нэмэх</span>
                </button>
              )}
              {sizeError && <p className="text-xs text-destructive mt-1">{sizeError}</p>}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-muted-foreground">Огноо</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full h-9 mt-1 rounded border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-muted-foreground">Тайлбар</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Тайлбар"
            className="w-full mt-1 rounded border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>

        <div className="flex justify-end">
          <Button size="sm" onClick={() => addMut.mutate()} disabled={!pending || addMut.isPending}>
            {addMut.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Хадгалах
          </Button>
        </div>
        {addMut.isSuccess && <p className="text-xs text-green-600">Файл амжилттай хадгаллаа.</p>}
      </div>

      {/* Preview modal */}
      {preview && <FilePreviewModal file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────── */

export function PatientInstrumentalExams({ patientId }: { patientId: string }) {
  const [examType, setExamType] = useState<InstrumentalExamType>("fibroscan");

  return (
    <Card>
      <CardContent className="pt-5">
        <ExamTabs active={examType} onChange={setExamType} />
        <ResultsSection patientId={patientId} examType={examType} />
        <FilesSection   patientId={patientId} examType={examType} />
      </CardContent>
    </Card>
  );
}
