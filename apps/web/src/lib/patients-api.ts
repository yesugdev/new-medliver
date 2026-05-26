import type { CreatePatientInput, Patient, PatientListResponse } from "@his/shared";
import { api } from "./api";

export interface ListPatientsParams {
  search?: string;
  gender?: "male" | "female" | "other";
  page?: number;
  pageSize?: number;
}

export async function listPatients(params: ListPatientsParams): Promise<PatientListResponse> {
  const { data } = await api.get<PatientListResponse>("/patients", { params });
  return data;
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await api.get<Patient>(`/patients/${id}`);
  return data;
}

export async function createPatient(payload: CreatePatientInput): Promise<Patient> {
  const { data } = await api.post<Patient>("/patients", payload);
  return data;
}

export async function updatePatient(
  id: string,
  payload: Partial<CreatePatientInput>,
): Promise<Patient> {
  const { data } = await api.patch<Patient>(`/patients/${id}`, payload);
  return data;
}

export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/patients/${id}`);
}
