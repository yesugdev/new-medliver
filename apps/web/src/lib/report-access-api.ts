import type { ReportAccessConfig, Role } from "@his/shared";
import { api } from "./api";

export async function getReportAccess(): Promise<ReportAccessConfig> {
  const { data } = await api.get<ReportAccessConfig>("/reports/access");
  return data;
}

export async function updateReportAccess(roles: Role[]): Promise<ReportAccessConfig> {
  const { data } = await api.put<ReportAccessConfig>("/reports/access", { roles });
  return data;
}
