import type { TreatmentTask, CreateTreatmentTaskInput, UpdateTreatmentTaskInput } from "@his/shared";
import { api } from "./api";

export interface ListTasksParams {
  date?: string;
  patientId?: string;
  status?: string;
  q?: string;
}

export async function listTreatmentTasks(params: ListTasksParams): Promise<TreatmentTask[]> {
  const { data } = await api.get<TreatmentTask[]>("/treatment-tasks", { params });
  return data;
}

export async function createTreatmentTask(payload: CreateTreatmentTaskInput): Promise<TreatmentTask> {
  const { data } = await api.post<TreatmentTask>("/treatment-tasks", payload);
  return data;
}

export async function updateTaskStatus(
  id: string,
  payload: UpdateTreatmentTaskInput,
): Promise<TreatmentTask> {
  const { data } = await api.patch<TreatmentTask>(`/treatment-tasks/${id}/status`, payload);
  return data;
}

export async function deleteTreatmentTask(id: string): Promise<void> {
  await api.delete(`/treatment-tasks/${id}`);
}
