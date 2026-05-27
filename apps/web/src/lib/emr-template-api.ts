import type { EmrTemplateConfig, EmrTabConfig } from "@his/shared";
import { api } from "./api";

export async function getEmrTemplate(): Promise<EmrTemplateConfig> {
  const { data } = await api.get<EmrTemplateConfig>("/emr/template");
  return data;
}

export async function updateEmrTemplate(tabs: EmrTabConfig[]): Promise<EmrTemplateConfig> {
  const { data } = await api.put<EmrTemplateConfig>("/emr/template", { tabs });
  return data;
}
