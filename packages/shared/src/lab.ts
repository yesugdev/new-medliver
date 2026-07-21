/* ─── Category ──────────────────────────────────────────────────────── */

/**
 * Ангиллын түлхүүр — өмнө нь хатуу бэхлэгдсэн union байсан ч одоо Admin
 * тохиргооноос динамикаар нэмэгддэг тул чөлөөт string болгосон. LabTest.category
 * нь энэ түлхүүрийг string-ээр л хадгалдаг тул шинэ ангилал нэмэгдэхэд
 * одоо байгаа өгөгдөлд ямар ч нөлөө үзүүлэхгүй.
 */
export type LabCategory = string;

/** Анхны (default/system) ангиллуудын seed мэдээлэл — Admin-аар устгагдахгүй */
export const DEFAULT_LAB_CATEGORIES: { key: LabCategory; name: string; sortOrder: number }[] = [
  { key: "rapid_tests",  name: "Түргэвчилсэн шинжилгээ", sortOrder: 0 },
  { key: "viral_load",   name: "Вирусын ачаалал",         sortOrder: 1 },
  { key: "biochemistry", name: "Биохими",                 sortOrder: 2 },
  { key: "hematology",   name: "Гематологи",               sortOrder: 3 },
  { key: "coagulogram",  name: "Коагулограмм",             sortOrder: 4 },
  { key: "immunology",   name: "Иммунологи",               sortOrder: 5 },
  { key: "urinalysis",   name: "Шээсний шинжилгээ",        sortOrder: 6 },
  { key: "hormones",     name: "Дааврын шинжилгээ",        sortOrder: 7 },
  { key: "microbiology", name: "Бактериологи",             sortOrder: 8 },
  { key: "other",        name: "Бусад",                    sortOrder: 9 },
];

/** Хуучин код-т зориулсан fallback label map — шинэ код дээр live /lab-categories ашиглана */
export const LAB_CATEGORY_LABELS_MN: Record<string, string> =
  Object.fromEntries(DEFAULT_LAB_CATEGORIES.map((c) => [c.key, c.name]));

export interface LabCategoryDef {
  id: string;
  key: string;
  name: string;
  nameEn?: string;
  isActive: boolean;
  /** Seed-ээр үүссэн, устгах боломжгүй систем ангилал */
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabCategoryInput {
  key: string;
  name: string;
  nameEn?: string;
  sortOrder?: number;
}

/** key нь үүсгэсний дараа өөрчлөгдөхгүй — одоо байгаа LabTest холбоосыг хамгаална */
export interface UpdateLabCategoryInput {
  name?: string;
  nameEn?: string;
  sortOrder?: number;
  isActive?: boolean;
}

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
  /** Шинжилгээ хийгдэх эмнэлэг / лаборатори */
  labName?: string;
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
