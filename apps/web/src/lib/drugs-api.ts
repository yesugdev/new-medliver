import type {
  Drug, CreateDrugInput, UpdateDrugInput,
  DrugBatch, CreateBatchInput, StockMovement, DrugReport, DrugExport,
} from "@his/shared";
import { api } from "./api";

export async function listDrugs(activeOnly = true): Promise<Drug[]> {
  const { data } = await api.get<Drug[]>("/drugs", {
    params: { activeOnly: String(activeOnly) },
  });
  return data;
}

export async function getDrug(id: string): Promise<Drug> {
  const { data } = await api.get<Drug>(`/drugs/${id}`);
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

/* ─── Цуврал / хөдөлгөөн ──────────────────────────────────────────── */
export async function listBatches(drugId: string): Promise<DrugBatch[]> {
  const { data } = await api.get<DrugBatch[]>(`/drugs/${drugId}/batches`);
  return data;
}

export async function addBatch(drugId: string, payload: CreateBatchInput): Promise<DrugBatch> {
  const { data } = await api.post<DrugBatch>(`/drugs/${drugId}/batches`, payload);
  return data;
}

export async function listMovements(drugId: string): Promise<StockMovement[]> {
  const { data } = await api.get<StockMovement[]>(`/drugs/${drugId}/movements`);
  return data;
}

export async function listExpiring(days = 30): Promise<DrugBatch[]> {
  const { data } = await api.get<DrugBatch[]>("/drugs/expiring", { params: { days } });
  return data;
}

export async function getDrugReports(): Promise<DrugReport> {
  const { data } = await api.get<DrugReport>("/drugs/reports");
  return data;
}

export async function getDrugExport(): Promise<DrugExport> {
  const { data } = await api.get<DrugExport>("/drugs/export");
  return data;
}
