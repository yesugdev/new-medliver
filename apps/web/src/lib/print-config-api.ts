import type { PrintConfig, UpdatePrintConfigInput } from "@his/shared";
import { api } from "./api";

export async function getPrintConfig(): Promise<PrintConfig> {
  const { data } = await api.get<PrintConfig>("/print-config");
  return data;
}

export async function updatePrintConfig(payload: UpdatePrintConfigInput): Promise<PrintConfig> {
  const { data } = await api.put<PrintConfig>("/print-config", payload);
  return data;
}
