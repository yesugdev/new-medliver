import type {
  CreateInvoiceInput,
  CreateServiceInput,
  Invoice,
  RecordPaymentInput,
  ServiceItem,
} from "@his/shared";
import { api } from "./api";

export async function listServices(activeOnly = false): Promise<ServiceItem[]> {
  const { data } = await api.get<ServiceItem[]>("/services", {
    params: activeOnly ? { activeOnly: "true" } : {},
  });
  return data;
}

export async function createService(payload: CreateServiceInput): Promise<ServiceItem> {
  const { data } = await api.post<ServiceItem>("/services", payload);
  return data;
}

export async function updateService(
  id: string,
  payload: Partial<CreateServiceInput> & { isActive?: boolean },
): Promise<ServiceItem> {
  const { data } = await api.patch<ServiceItem>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

export interface ListInvoicesParams {
  patientId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listInvoices(params: ListInvoicesParams = {}) {
  const { data } = await api.get<{
    items: Invoice[];
    total: number;
    page: number;
    pageSize: number;
  }>("/invoices", { params });
  return data;
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { data } = await api.get<Invoice>(`/invoices/${id}`);
  return data;
}

export async function createInvoice(payload: CreateInvoiceInput): Promise<Invoice> {
  const { data } = await api.post<Invoice>("/invoices", payload);
  return data;
}

export async function recordPayment(
  id: string,
  payload: RecordPaymentInput,
): Promise<Invoice> {
  const { data } = await api.post<Invoice>(`/invoices/${id}/payments`, payload);
  return data;
}

export async function cancelInvoice(id: string): Promise<Invoice> {
  const { data } = await api.patch<Invoice>(`/invoices/${id}/cancel`);
  return data;
}
