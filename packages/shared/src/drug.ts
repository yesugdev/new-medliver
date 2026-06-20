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

/* ─── Тохируулдаг сонголтууд (ангилал, үйлдвэрлэгч) ──────────────── */
export const DRUG_OPTION_TYPES = ["manufacturer", "category"] as const;
export type DrugOptionType = (typeof DRUG_OPTION_TYPES)[number];

export interface DrugOption {
  id: string;
  type: DrugOptionType;
  name: string;
  order: number;
}

export interface CreateDrugOptionInput {
  type: DrugOptionType;
  name: string;
}

export interface Drug {
  id: string;
  /** Эмийн код (Drug Master) */
  code?: string;
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
  code?: string;
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
  code?: string;
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
  /** Эмийн нэр (тайланд бүлэглэхэд) */
  drugName?: string;
  batchNumber: string;
  /** ISO date */
  expiryDate: string;
  /** Үлдсэн тоо хэмжээ */
  quantity: number;
  /** Орлогодсон анхны тоо хэмжээ */
  initialQuantity: number;
  /** Нэгж өртөг (худалдан авсан үнэ) */
  costPrice: number;
  /** Зарах нэгж үнэ */
  salePrice: number;
  /** Нийлүүлэгч */
  supplier?: string;
  /** ISO date — орлогодсон огноо */
  receivedAt: string;
  createdAt: string;
}

export interface CreateBatchInput {
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  supplier?: string;
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

/** Эм → түүний нөөцийн цувралууд (Drug Master + Inventory Batches) */
export interface DrugInventoryRow {
  drugId: string;
  code?: string;
  name: string;
  dosage: string;
  form: string;
  unit: string;
  stock: number;
  batches: DrugBatch[];
}

export interface DrugReport {
  totalValuation: number;
  totalDrugs: number;
  lowStock: DrugReportRow[];
  expiringSoon: DrugBatch[];
  expired: DrugBatch[];
  /** Эм бүрийн нөөцийн цувралын дэлгэрэнгүй */
  inventory: DrugInventoryRow[];
}
