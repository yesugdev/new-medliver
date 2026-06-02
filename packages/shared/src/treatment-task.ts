export type TreatmentTaskStatus = "pending" | "done" | "skipped";

export interface TreatmentTask {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  registerNumber?: string;

  drugName: string;      // nameFormDosage
  route?: string;
  frequency?: number;    // өдөрт хэдэн удаа
  perDose?: number;      // нэг удаа хэдийг
  notes?: string;

  scheduledDate: string; // ISO date string (YYYY-MM-DD)
  status: TreatmentTaskStatus;

  doneAt?: string;
  doneById?: string;
  doneByName?: string;
  doneNote?: string;

  sourceRecordId?: string;  // TreatmentRecord._id
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface CreateTreatmentTaskInput {
  patientId: string;
  drugName: string;
  route?: string;
  frequency?: number;
  perDose?: number;
  notes?: string;
  scheduledDate?: string; // default today
}

export interface UpdateTreatmentTaskInput {
  status: TreatmentTaskStatus;
  doneNote?: string;
}
