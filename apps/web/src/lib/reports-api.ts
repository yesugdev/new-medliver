import type {
  PatientReport,
  LaboratoryReport,
  FinancialReport,
  ReportRange,
} from "@his/shared";
import { api } from "./api";

export async function getPatientReport(range: ReportRange): Promise<PatientReport> {
  const { data } = await api.get<PatientReport>("/reports/patient", { params: range });
  return data;
}

export async function getLaboratoryReport(range: ReportRange): Promise<LaboratoryReport> {
  const { data } = await api.get<LaboratoryReport>("/reports/laboratory", { params: range });
  return data;
}

export async function getFinancialReport(range: ReportRange): Promise<FinancialReport> {
  const { data } = await api.get<FinancialReport>("/reports/financial", { params: range });
  return data;
}
