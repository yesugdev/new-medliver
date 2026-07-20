export interface PrintConfig {
  id: string;
  orgName: string;
  orgSubtitle?: string;
  orgAddress?: string;
  orgPhone?: string;
  orgEmail?: string;
  logoUrl?: string;
  showLogo: boolean;
  stampUrl?: string;
  showStamp: boolean;
  headerBgColor: string;
  headerTextColor: string;
  fontSize: number;
  pageSize: "A4" | "A5";
  pageOrientation: "portrait" | "landscape";
  footerNote?: string;

  /* ── Thermal receipt (58мм / 76мм / 80мм) тохиргоо ── */
  receiptWidth: "58" | "76" | "80";

  /* ── Өвчтөний мэдээллийн харагдах талбарууд ── */
  showPatientCode: boolean;
  showPatientRegister: boolean;
  showPatientAge: boolean;
  showPatientGender: boolean;
  showPatientPhone: boolean;
  showPatientAddress: boolean;
  showPatientBloodType: boolean;
  showPatientBirthDate: boolean;
  showPatientDoctor: boolean;

  updatedAt: string;
}

export interface UpdatePrintConfigInput {
  orgName?: string;
  orgSubtitle?: string;
  orgAddress?: string;
  orgPhone?: string;
  orgEmail?: string;
  logoUrl?: string;
  showLogo?: boolean;
  stampUrl?: string;
  showStamp?: boolean;
  headerBgColor?: string;
  headerTextColor?: string;
  fontSize?: number;
  pageSize?: "A4" | "A5";
  pageOrientation?: "portrait" | "landscape";
  footerNote?: string;
  receiptWidth?: "58" | "76" | "80";
  showPatientCode?: boolean;
  showPatientRegister?: boolean;
  showPatientAge?: boolean;
  showPatientGender?: boolean;
  showPatientPhone?: boolean;
  showPatientAddress?: boolean;
  showPatientBloodType?: boolean;
  showPatientBirthDate?: boolean;
  showPatientDoctor?: boolean;
}
