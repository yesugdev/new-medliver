import type {
  LabTest,
  LabOrder,
  LabOrderListResponse,
  CreateLabTestInput,
  UpdateLabTestInput,
  CreateLabOrderInput,
  RecordLabResultItem,
} from "@his/shared";
import { api } from "./api";

/* ── Test catalog ───────────────────────────────────────────────────── */
export async function listLabTests(all = false): Promise<LabTest[]> {
  const { data } = await api.get<LabTest[]>("/lab/tests", {
    params: all ? { all: "true" } : {},
  });
  return data;
}

export async function createLabTest(payload: CreateLabTestInput): Promise<LabTest> {
  const { data } = await api.post<LabTest>("/lab/tests", payload);
  return data;
}

export async function updateLabTest(
  id: string,
  payload: UpdateLabTestInput,
): Promise<LabTest> {
  const { data } = await api.patch<LabTest>(`/lab/tests/${id}`, payload);
  return data;
}

/* ── Orders ─────────────────────────────────────────────────────────── */
export interface ListOrdersParams {
  patientId?: string;
  doctorId?: string;
  from?: string;
  to?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listLabOrders(
  params: ListOrdersParams = {},
): Promise<LabOrderListResponse> {
  const { data } = await api.get<LabOrderListResponse>("/lab/orders", { params });
  return data;
}

export async function getLabOrder(id: string): Promise<LabOrder> {
  const { data } = await api.get<LabOrder>(`/lab/orders/${id}`);
  return data;
}

export async function createLabOrder(
  payload: CreateLabOrderInput,
): Promise<LabOrder> {
  const { data } = await api.post<LabOrder>("/lab/orders", payload);
  return data;
}

export async function recordLabResults(
  orderId: string,
  items: RecordLabResultItem[],
): Promise<LabOrder> {
  const { data } = await api.patch<LabOrder>(`/lab/orders/${orderId}/results`, { items });
  return data;
}

export async function cancelLabOrder(id: string): Promise<LabOrder> {
  const { data } = await api.patch<LabOrder>(`/lab/orders/${id}/cancel`);
  return data;
}
