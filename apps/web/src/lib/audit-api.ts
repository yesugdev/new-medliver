import type { AuditLogResponse } from "@his/shared";
import { api } from "./api";

export interface ListAuditParams {
  action?: string;
  resource?: string;
  actorEmail?: string;
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs(params: ListAuditParams = {}): Promise<AuditLogResponse> {
  const { data } = await api.get<AuditLogResponse>("/audit", { params });
  return data;
}
