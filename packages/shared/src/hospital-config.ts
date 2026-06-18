export interface HospitalConfig {
  id: string;
  name: string;
  logoBase64?: string;
  faviconBase64?: string;
  updatedAt: string;
}

export interface UpdateHospitalConfigInput {
  name?: string;
  logoBase64?: string;
  faviconBase64?: string;
}
