import type { HospitalConfig, UpdateHospitalConfigInput } from "@his/shared";
import { api } from "./api";

export async function getHospitalConfig(): Promise<HospitalConfig> {
  const { data } = await api.get<HospitalConfig>("/hospital-config");
  return data;
}

export async function updateHospitalConfig(
  payload: UpdateHospitalConfigInput,
): Promise<HospitalConfig> {
  const { data } = await api.put<HospitalConfig>("/hospital-config", payload);
  return data;
}
