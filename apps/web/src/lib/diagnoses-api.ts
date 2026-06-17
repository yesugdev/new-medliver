import type {
  PatientDiagnosis,
  ClinicalScore,
  CreatePatientDiagnosisInput,
  CreateClinicalScoreInput,
} from "@his/shared";
import { api } from "./api";

export async function getPatientDiagnoses(patientId: string): Promise<PatientDiagnosis[]> {
  const { data } = await api.get<PatientDiagnosis[]>(`/patients/${patientId}/diagnoses`);
  return data;
}

export async function createPatientDiagnosis(
  patientId: string,
  input: CreatePatientDiagnosisInput,
): Promise<PatientDiagnosis> {
  const { data } = await api.post<PatientDiagnosis>(`/patients/${patientId}/diagnoses`, input);
  return data;
}

export async function deletePatientDiagnosis(patientId: string, did: string): Promise<void> {
  await api.delete(`/patients/${patientId}/diagnoses/${did}`);
}

export async function getPatientClinicalScores(patientId: string): Promise<ClinicalScore[]> {
  const { data } = await api.get<ClinicalScore[]>(`/patients/${patientId}/clinical-scores`);
  return data;
}

export async function createClinicalScore(
  patientId: string,
  input: CreateClinicalScoreInput,
): Promise<ClinicalScore> {
  const { data } = await api.post<ClinicalScore>(`/patients/${patientId}/clinical-scores`, input);
  return data;
}

export async function deleteClinicalScore(patientId: string, sid: string): Promise<void> {
  await api.delete(`/patients/${patientId}/clinical-scores/${sid}`);
}
