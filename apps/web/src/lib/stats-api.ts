import type { DashboardStats } from "@his/shared";
import { api } from "./api";

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/stats/dashboard");
  return data;
}
