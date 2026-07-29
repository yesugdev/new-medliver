import type {
  EbarimtConfig,
  EbarimtInfo,
  EbarimtReceipt,
  UpdateEbarimtConfigInput,
} from "@his/shared";
import { api } from "./api";

export async function getEbarimtConfig(): Promise<EbarimtConfig> {
  const { data } = await api.get<EbarimtConfig>("/ebarimt/config");
  return data;
}

export async function updateEbarimtConfig(
  payload: UpdateEbarimtConfigInput,
): Promise<EbarimtConfig> {
  const { data } = await api.put<EbarimtConfig>("/ebarimt/config", payload);
  return data;
}

/** PosAPI холболт шалгах */
export async function getEbarimtInfo(): Promise<EbarimtInfo> {
  const { data } = await api.get<EbarimtInfo>("/ebarimt/info");
  return data;
}

export async function getEbarimtReceipt(invoiceId: string): Promise<EbarimtReceipt | null> {
  const { data } = await api.get<EbarimtReceipt | null>(`/ebarimt/receipt/${invoiceId}`);
  return data;
}

export async function createEbarimtReceipt(invoiceId: string): Promise<EbarimtReceipt> {
  const { data } = await api.post<EbarimtReceipt>(`/ebarimt/receipt/${invoiceId}`);
  return data;
}

export async function deleteEbarimtReceipt(invoiceId: string): Promise<void> {
  await api.delete(`/ebarimt/receipt/${invoiceId}`);
}
