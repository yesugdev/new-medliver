import type { ComplaintOption, PatientComplaint, CreateComplaintInput, CreateComplaintOptionInput } from "@his/shared";
import { api } from "./api";

/* ── Options ─────────────────────────────────────────────────────── */

export async function getComplaintOptions(): Promise<ComplaintOption[]> {
  const { data } = await api.get<ComplaintOption[]>("/complaint-options");
  return data;
}

export async function createComplaintOption(input: CreateComplaintOptionInput): Promise<ComplaintOption> {
  const { data } = await api.post<ComplaintOption>("/complaint-options", input);
  return data;
}

export async function deleteComplaintOption(id: string): Promise<void> {
  await api.delete(`/complaint-options/${id}`);
}

/* ── Patient complaints ──────────────────────────────────────────── */

export async function getPatientComplaints(patientId: string): Promise<PatientComplaint[]> {
  const { data } = await api.get<PatientComplaint[]>(`/patients/${patientId}/complaints`);
  return data;
}

export async function createPatientComplaint(
  patientId: string,
  input: CreateComplaintInput,
): Promise<PatientComplaint> {
  const { data } = await api.post<PatientComplaint>(`/patients/${patientId}/complaints`, input);
  return data;
}

export async function deletePatientComplaint(patientId: string, cid: string): Promise<void> {
  await api.delete(`/patients/${patientId}/complaints/${cid}`);
}
