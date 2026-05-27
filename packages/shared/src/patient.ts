export type Gender = "male" | "female" | "other";

export const GENDER_LABELS_MN: Record<Gender, string> = {
  male: "Эрэгтэй",
  female: "Эмэгтэй",
  other: "Бусад",
};

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  registerNumber: string;
  lastName: string;
  firstName: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email?: string;
  address?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: EmergencyContact;
  notes?: string;
  attendingDoctorId?: string;
  attendingDoctorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientInput {
  registerNumber: string;
  lastName: string;
  firstName: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email?: string;
  address?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: EmergencyContact;
  notes?: string;
  attendingDoctorId?: string;
  attendingDoctorName?: string;
}

export interface PatientListResponse {
  items: Patient[];
  total: number;
  page: number;
  pageSize: number;
}
