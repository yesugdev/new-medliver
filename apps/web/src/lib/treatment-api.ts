import type { CreateTreatmentInput, TreatmentRecord } from "@his/shared";
import { api } from "./api";

export async function listTreatments(patientId: string): Promise<TreatmentRecord[]> {
  const { data } = await api.get<TreatmentRecord[]>(`/patients/${patientId}/treatments`);
  return data;
}

export async function createTreatment(
  patientId: string,
  payload: CreateTreatmentInput,
): Promise<TreatmentRecord> {
  const { data } = await api.post<TreatmentRecord>(
    `/patients/${patientId}/treatments`,
    payload,
  );
  return data;
}

export async function deleteTreatment(
  patientId: string,
  treatmentId: string,
): Promise<void> {
  await api.delete(`/patients/${patientId}/treatments/${treatmentId}`);
}
