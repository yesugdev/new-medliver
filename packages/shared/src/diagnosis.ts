export interface DiagnosisEntry {
  code?: string;
  name: string;
  notes?: string;
}

export interface PatientDiagnosis {
  id: string;
  patientId: string;
  date: string;
  primary: DiagnosisEntry;
  comorbidities: DiagnosisEntry[];
  recordedById: string;
  recordedByName: string;
  createdAt: string;
}

export type ClinicalScoreType = "meld" | "child_pugh" | "qtc_framingham";

export interface ClinicalScore {
  id: string;
  patientId: string;
  date: string;
  type: ClinicalScoreType;
  inputs: Record<string, number | string>;
  score: number;
  grade?: string;
  interpretation: string;
  recordedById: string;
  recordedByName: string;
  createdAt: string;
}

export interface CreatePatientDiagnosisInput {
  date: string;
  primary: DiagnosisEntry;
  comorbidities: DiagnosisEntry[];
}

export interface CreateClinicalScoreInput {
  date: string;
  type: ClinicalScoreType;
  inputs: Record<string, number | string>;
  score: number;
  grade?: string;
  interpretation: string;
}
