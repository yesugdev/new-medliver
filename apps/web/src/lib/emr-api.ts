import type { CreateVisitInput, UpdateVisitInput, Visit } from "@his/shared";
import { api } from "./api";

export async function listVisitsByPatient(patientId: string): Promise<Visit[]> {
  const { data } = await api.get<Visit[]>("/visits", { params: { patientId } });
  return data;
}

export async function getVisit(id: string): Promise<Visit> {
  const { data } = await api.get<Visit>(`/visits/${id}`);
  return data;
}

export async function createVisit(payload: CreateVisitInput): Promise<Visit> {
  const { data } = await api.post<Visit>("/visits", payload);
  return data;
}

export async function updateVisit(id: string, payload: UpdateVisitInput): Promise<Visit> {
  const { data } = await api.patch<Visit>(`/visits/${id}`, payload);
  return data;
}
