import type { VitalsRecord, CreateVitalsRecordInput } from "@his/shared";
import { api } from "./api";

export async function createVitalsRecord(
  payload: CreateVitalsRecordInput,
): Promise<VitalsRecord> {
  const { data } = await api.post<VitalsRecord>("/vitals", payload);
  return data;
}

export async function listPatientVitals(patientId: string): Promise<VitalsRecord[]> {
  const { data } = await api.get<VitalsRecord[]>("/vitals", { params: { patientId } });
  return data;
}

export async function getLatestVitals(patientId: string): Promise<VitalsRecord | null> {
  try {
    const { data } = await api.get<VitalsRecord>("/vitals/latest", { params: { patientId } });
    return data;
  } catch {
    return null;
  }
}
