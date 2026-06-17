export type InstrumentalExamType =
  | "fibroscan"
  | "ultrasound"
  | "ct"
  | "mri"
  | "endoscopy"
  | "opthalmalogical"
  | "biopsy"
  | "others"
  | "eeg"
  | "ecg"
  | "pap_smear";

export const INSTRUMENTAL_EXAM_LABELS: Record<InstrumentalExamType, string> = {
  fibroscan:       "Fibroscan",
  ultrasound:      "UltraSound",
  ct:              "CT",
  mri:             "MRI",
  endoscopy:       "Endoscopy",
  opthalmalogical: "Opthalmalogical exam",
  biopsy:          "Biopsy",
  others:          "Others",
  eeg:             "EEG",
  ecg:             "ECG",
  pap_smear:       "PAP smear",
};

export const INSTRUMENTAL_EXAM_TYPES = Object.keys(
  INSTRUMENTAL_EXAM_LABELS,
) as InstrumentalExamType[];

/* ── Result entry (top table) ─────────────────────────────────────── */

export interface InstrumentalExamResult {
  id: string;
  patientId: string;
  examType: InstrumentalExamType;
  date: string;
  result: string;
  notes?: string;
  recordedById: string;
  recordedByName: string;
  createdAt: string;
}

export interface CreateInstrumentalExamResultInput {
  examType: InstrumentalExamType;
  date: string;
  result: string;
  notes?: string;
}

/* ── File entry (file table) ──────────────────────────────────────── */

export interface InstrumentalExamFile {
  id: string;
  patientId: string;
  examType: InstrumentalExamType;
  date: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileData: string;
  notes?: string;
  recordedById: string;
  recordedByName: string;
  createdAt: string;
}

export interface CreateInstrumentalExamFileInput {
  examType: InstrumentalExamType;
  date: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileData: string;
  notes?: string;
}
