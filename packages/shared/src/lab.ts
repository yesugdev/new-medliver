/* ─── Category ──────────────────────────────────────────────────────── */

export type LabCategory =
  | "hematology"
  | "biochemistry"
  | "urinalysis"
  | "immunology"
  | "rapid_tests"
  | "viral_load"
  | "coagulogram"
  | "microbiology"
  | "hormones"
  | "other";

export const LAB_CATEGORY_LABELS_MN: Record<LabCategory, string> = {
  hematology:   "Гематологи",
  biochemistry: "Биохими",
  urinalysis:   "Шээсний шинжилгээ",
  immunology:   "Иммунологи",
  rapid_tests:  "Түргэвчилсэн шинжилгээ",
  viral_load:   "Вирусын ачаалал",
  coagulogram:  "Коагулограмм",
  microbiology: "Бактериологи",
  hormones:     "Дааврын шинжилгээ",
  other:        "Бусад",
};

/* ─── Priority ──────────────────────────────────────────────────────── */

export type LabPriority = "routine" | "urgent" | "stat";

export const LAB_PRIORITY_LABELS_MN: Record<LabPriority, string> = {
  routine: "Ердийн",
  urgent:  "Яаралтай",
  stat:    "Нэн яаралтай",
};

/* ─── Order status ──────────────────────────────────────────────────── */

export type LabOrderStatus = "ordered" | "partial" | "completed" | "cancelled";

export const LAB_ORDER_STATUS_LABELS_MN: Record<LabOrderStatus, string> = {
  ordered:   "Хүлээгдэж буй",
  partial:   "Хэсэгчилсэн",
  completed: "Бүрэн хариутай",
  cancelled: "Цуцлагдсан",
};

export type LabItemStatus = "ordered" | "resulted" | "cancelled";

/* ─── Interpretation ────────────────────────────────────────────────── */

export type LabInterpretation =
  | "normal" | "low" | "high"
  | "critical_low" | "critical_high"
  | "abnormal";

export const LAB_INTERPRETATION_LABELS_MN: Record<LabInterpretation, string> = {
  normal:        "Хэвийн",
  low:           "Бага",
  high:          "Их",
  critical_low:  "Маш бага ⚠",
  critical_high: "Маш их ⚠",
  abnormal:      "Хэвийн бус",
};

/* ─── Test catalog ──────────────────────────────────────────────────── */

export interface LabTest {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  category: LabCategory;
  /** Sub-category / group name, e.g. "Элэгний үйл ажиллагааны шинжилгээ" */
  testGroup?: string;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  /** Qualitative reference, e.g. "Сөрөг" */
  referenceText?: string;
  /** "text" for numeric/free-text, "select" for qualitative dropdown */
  inputType: "text" | "select";
  /** Only for inputType="select" */
  options?: string[];
  turnaroundHours?: number;
  sortOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ─── Order item (snapshot + result) ───────────────────────────────── */

export interface LabOrderItem {
  testId: string;
  testCode: string;
  testName: string;
  testGroup?: string;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  referenceText?: string;
  inputType: "text" | "select";
  options?: string[];
  status: LabItemStatus;
  value?: string;
  interpretation?: LabInterpretation;
  notes?: string;
  resultedAt?: string;
  resultedByName?: string;
}

/* ─── Order ─────────────────────────────────────────────────────────── */

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  doctorId: string;
  doctorName: string;
  visitId?: string;
  orderedAt: string;
  status: LabOrderStatus;
  priority: LabPriority;
  clinicalNote?: string;
  /** Шинжилгээ хийгдсэн эмнэлэг / лаборатори */
  labName?: string;
  items: LabOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LabOrderListResponse {
  items: LabOrder[];
  total: number;
}

/* ─── Inputs ────────────────────────────────────────────────────────── */

export interface CreateLabTestInput {
  code: string;
  name: string;
  nameEn?: string;
  category: LabCategory;
  testGroup?: string;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  referenceText?: string;
  inputType?: "text" | "select";
  options?: string[];
  turnaroundHours?: number;
  sortOrder?: number;
}

export interface UpdateLabTestInput extends Partial<CreateLabTestInput> {
  isActive?: boolean;
}

export interface CreateLabOrderInput {
  patientId: string;
  visitId?: string;
  priority?: LabPriority;
  clinicalNote?: string;
  testIds: string[];
}

export interface RecordLabResultItem {
  testId: string;
  value: string;
  notes?: string;
}

/** Захиалга үүсгэлгүйгээр шууд хариу оруулах */
export interface QuickLabResultInput {
  patientId: string;
  visitId?: string;
  /** Шинжилгээ хийсэн огноо (ISO). Байхгүй бол өнөөдөр */
  date?: string;
  labName?: string;
  items: { testId: string; value: string; notes?: string }[];
}
