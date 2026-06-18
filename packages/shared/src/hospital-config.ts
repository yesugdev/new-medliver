export interface HospitalConfig {
  id: string;
  name: string;
  logoBase64?: string;
  faviconBase64?: string;
  /** НӨАТ тооцоолох эсэх */
  vatEnabled: boolean;
  /** НӨАТ хувь (жш: 10) */
  vatRate: number;
  updatedAt: string;
}

export interface UpdateHospitalConfigInput {
  name?: string;
  logoBase64?: string;
  faviconBase64?: string;
  vatEnabled?: boolean;
  vatRate?: number;
}
