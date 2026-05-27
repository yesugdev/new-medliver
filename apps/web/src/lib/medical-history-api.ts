import type { CreateMedicalHistoryInput, MedicalHistoryRecord } from "@his/shared";
import { api } from "./api";

export async function listMedicalHistory(patientId: string): Promise<MedicalHistoryRecord[]> {
  const { data } = await api.get<MedicalHistoryRecord[]>(`/patients/${patientId}/medical-history`);
  return data;
}

export async function createMedicalHistory(
  patientId: string,
  payload: CreateMedicalHistoryInput,
): Promise<MedicalHistoryRecord> {
  const { data } = await api.post<MedicalHistoryRecord>(
    `/patients/${patientId}/medical-history`,
    payload,
  );
  return data;
}

export async function deleteMedicalHistory(
  patientId: string,
  historyId: string,
): Promise<void> {
  await api.delete(`/patients/${patientId}/medical-history/${historyId}`);
}
