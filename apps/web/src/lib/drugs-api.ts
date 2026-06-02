import type { Drug, CreateDrugInput, UpdateDrugInput } from "@his/shared";
import { api } from "./api";

export async function listDrugs(activeOnly = true): Promise<Drug[]> {
  const { data } = await api.get<Drug[]>("/drugs", {
    params: { activeOnly: String(activeOnly) },
  });
  return data;
}

export async function createDrug(payload: CreateDrugInput): Promise<Drug> {
  const { data } = await api.post<Drug>("/drugs", payload);
  return data;
}

export async function updateDrug(id: string, payload: UpdateDrugInput): Promise<Drug> {
  const { data } = await api.patch<Drug>(`/drugs/${id}`, payload);
  return data;
}

export async function deleteDrug(id: string): Promise<void> {
  await api.delete(`/drugs/${id}`);
}

export async function adjustStock(id: string, delta: number): Promise<void> {
  await api.patch(`/drugs/${id}/stock`, { delta });
}
