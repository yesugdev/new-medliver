/* ─── Ebarimt (PosAPI 3.0) integration types ────────────────────────── */

export type EbarimtReceiptType =
  | "B2C_RECEIPT"
  | "B2B_RECEIPT"
  | "B2C_INVOICE"
  | "B2B_INVOICE";

/**
 * PosAPI холболтын тохиргоо (singleton). Merchant бүртгэл аваагүй үед
 * enabled=false байж, UI дээр И-Баримт товч харагдахгүй.
 */
export interface EbarimtConfig {
  id: string;
  /** И-Баримт систем идэвхтэй эсэх */
  enabled: boolean;
  /** PosAPI сервисийн хаяг, жишээ: http://localhost:7080 */
  posApiUrl: string;
  /** Байгууллагын ТТД (11 эсвэл 14 оронтой) */
  merchantTin: string;
  /** Дүүргийн код (4 оронтой) */
  districtCode: string;
  /** Кассын дугаар (PosNo) */
  posNo: string;
  /** Үйлчилгээний ангиллын код (ҮАБ) — бүх мөрөнд ашиглах анхдагч код */
  classificationCode: string;
  updatedAt: string;
}

export interface UpdateEbarimtConfigInput {
  enabled?: boolean;
  posApiUrl?: string;
  merchantTin?: string;
  districtCode?: string;
  posNo?: string;
  classificationCode?: string;
}

/** Гаргасан И-Баримтын бүртгэл (нэхэмжлэлтэй 1:1 холбоотой) */
export interface EbarimtReceipt {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  /** PosAPI-гаас буцаасан баримтын ID (33 тэмдэгт) */
  ebarimtId: string;
  /** Сугалааны дугаар */
  lottery?: string;
  /** QR кодын өгөгдөл */
  qrData?: string;
  totalAmount: number;
  totalVAT: number;
  type: EbarimtReceiptType;
  /** PosAPI баримтын огноо (yyyy-MM-dd HH:mm:ss) */
  date: string;
  status: string;
  createdAt: string;
}

/** GET /rest/info — PosAPI байдал, merchant жагсаалт */
export interface EbarimtInfo {
  operatorName?: string;
  operatorTIN?: string;
  posId?: number;
  posNo?: string;
  lastSentDate?: string;
  leftLotteries?: number;
  merchants?: { name: string; tin: string }[];
}
