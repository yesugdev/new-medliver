export interface PrintConfig {
  id: string;
  orgName: string;
  orgSubtitle?: string;
  orgAddress?: string;
  orgPhone?: string;
  orgEmail?: string;
  logoUrl?: string;         // URL or base64 data URI
  showLogo: boolean;
  headerBgColor: string;    // CSS hex e.g. "#1e293b"
  headerTextColor: string;  // CSS hex e.g. "#ffffff"
  fontSize: number;         // 11–16
  pageSize: "A4" | "A5";
  pageOrientation: "portrait" | "landscape";
  footerNote?: string;
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
  headerBgColor?: string;
  headerTextColor?: string;
  fontSize?: number;
  pageSize?: "A4" | "A5";
  pageOrientation?: "portrait" | "landscape";
  footerNote?: string;
}
