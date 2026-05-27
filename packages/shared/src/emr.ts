export interface Vitals {
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface VitalsRecord {
  id: string;
  patientId: string;
  recordedById: string;
  recordedByName: string;
  recordedAt: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  createdAt: string;
}

export interface CreateVitalsRecordInput {
  patientId: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export type VisitStatus = "in_progress" | "completed";

export const VISIT_STATUS_LABELS_MN: Record<VisitStatus, string> = {
  in_progress: "Үзлэг хийгдэж буй",
  completed: "Дууссан",
};

export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  visitDate: string;
  status: VisitStatus;
  chiefComplaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  vitals?: Vitals;
  prescriptions?: Prescription[];
  /** Dynamic clinical notes: sectionId → { fieldId: value } */
  clinicalNotes?: Record<string, Record<string, string | number | boolean>>;
  createdAt: string;
  updatedAt: string;
}

/* ─── EMR Template (admin-configurable) ────────────────────────────── */

export type EmrFieldType = "text" | "textarea" | "select" | "number" | "radio" | "checkbox";

export interface EmrFieldConfig {
  id: string;
  label: string;
  type: EmrFieldType;
  options?: string[];
  required?: boolean;
  unit?: string;
  placeholder?: string;
}

export interface EmrSectionConfig {
  id: string;
  name: string;
  order: number;
  /** "vitals" renders the vitals widget; "custom" renders configured fields */
  type: "vitals" | "custom";
  fields: EmrFieldConfig[];
}

export interface EmrTabConfig {
  id: string;
  name: string;
  order: number;
  sections: EmrSectionConfig[];
}

export interface EmrTemplateConfig {
  id: string;
  tabs: EmrTabConfig[];
  updatedAt: string;
}

export interface CreateVisitInput {
  patientId: string;
  appointmentId?: string;
  chiefComplaint?: string;
}

export interface UpdateVisitInput {
  chiefComplaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  vitals?: Vitals;
  prescriptions?: Prescription[];
  clinicalNotes?: Record<string, Record<string, string | number | boolean>>;
  status?: VisitStatus;
}
