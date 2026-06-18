/** Эмийн ангилал — тайлан, шүүлтүүрт ашиглана */
export const DRUG_CATEGORIES = [
  "Антибиотик",
  "Өвдөлт намдаах",
  "Халууруулалт",
  "Витамин",
  "Ходоод-гэдэс",
  "Зүрх судас",
  "Амьсгалын зам",
  "Харшил",
  "Бусад",
] as const;

export type DrugCategory = (typeof DRUG_CATEGORIES)[number];

export interface Drug {
  id: string;
  name: string;
  form: string;
  dosage: string;
  unit: string;
  category?: string;
  manufacturer?: string;
  /** Өвчтөнд тооцох нэгж үнэ */
  salePrice: number;
  /** Бүх цувралын нийлбэр нөөц (cache) */
  stock: number;
  minStock: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDrugInput {
  name: string;
  form: string;
  dosage: string;
  unit: string;
  category?: string;
  manufacturer?: string;
  salePrice?: number;
  /** Анхны нөөц — өгвөл эхний цуврал автоматаар үүснэ */
  stock?: number;
  minStock?: number;
  description?: string;
}

export interface UpdateDrugInput {
  name?: string;
  form?: string;
  dosage?: string;
  unit?: string;
  category?: string;
  manufacturer?: string;
  salePrice?: number;
  minStock?: number;
  description?: string;
  isActive?: boolean;
}

/** Гар нөөц тохируулга (admin) */
export interface AdjustStockInput {
  delta: number; // positive = add, negative = deduct
}

/* ─── Цуврал (batch) ─────────────────────────────────────────────── */
export interface DrugBatch {
  id: string;
  drugId: string;
  batchNumber: string;
  /** ISO date */
  expiryDate: string;
  /** Үлдсэн тоо хэмжээ */
  quantity: number;
  /** Орлогодсон анхны тоо хэмжээ */
  initialQuantity: number;
  /** Нэгж өртөг (орлогын үнэ) */
  costPrice: number;
  /** ISO date — орлогодсон огноо */
  receivedAt: string;
  createdAt: string;
}

export interface CreateBatchInput {
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  receivedAt?: string;
}

/* ─── Нөөцийн хөдөлгөөн ───────────────────────────────────────────── */
export type StockMovementType = "in" | "out" | "adjust" | "expire";

export const STOCK_MOVEMENT_LABELS_MN: Record<StockMovementType, string> = {
  in: "Орлого",
  out: "Зарлага",
  adjust: "Тохируулга",
  expire: "Хугацаа дууссан",
};

export interface StockMovement {
  id: string;
  drugId: string;
  drugName?: string;
  batchId?: string;
  type: StockMovementType;
  /** Тэмдэгтэй: орлого +, зарлага − */
  quantity: number;
  reason?: string;
  refType?: string;
  refId?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
}

/* ─── Тайлан ─────────────────────────────────────────────────────── */
export interface DrugReportRow {
  drugId: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  /** Σ batch.quantity × batch.costPrice */
  valuation: number;
}

export interface DrugReport {
  totalValuation: number;
  totalDrugs: number;
  lowStock: DrugReportRow[];
  expiringSoon: DrugBatch[];
  expired: DrugBatch[];
}
