import type {
  LabCategoryDef,
  CreateLabCategoryInput,
  UpdateLabCategoryInput,
} from "@his/shared";
import { api } from "./api";

export async function listLabCategories(all = false): Promise<LabCategoryDef[]> {
  const { data } = await api.get<LabCategoryDef[]>("/lab-categories", {
    params: all ? { all: "true" } : {},
  });
  return data;
}

export async function createLabCategory(payload: CreateLabCategoryInput): Promise<LabCategoryDef> {
  const { data } = await api.post<LabCategoryDef>("/lab-categories", payload);
  return data;
}

export async function updateLabCategory(
  id: string,
  payload: UpdateLabCategoryInput,
): Promise<LabCategoryDef> {
  const { data } = await api.patch<LabCategoryDef>(`/lab-categories/${id}`, payload);
  return data;
}

export async function deleteLabCategory(id: string): Promise<void> {
  await api.delete(`/lab-categories/${id}`);
}
