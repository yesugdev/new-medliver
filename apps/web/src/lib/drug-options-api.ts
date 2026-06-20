import type { DrugOption, CreateDrugOptionInput } from "@his/shared";
import { api } from "./api";

export async function getDrugOptions(): Promise<DrugOption[]> {
  const { data } = await api.get<DrugOption[]>("/drug-options");
  return data;
}

export async function createDrugOption(payload: CreateDrugOptionInput): Promise<DrugOption> {
  const { data } = await api.post<DrugOption>("/drug-options", payload);
  return data;
}

export async function deleteDrugOption(id: string): Promise<void> {
  await api.delete(`/drug-options/${id}`);
}
