/** All standard drug administration routes in Mongolian */
export const DRUG_ROUTES = [
  "Амаар",
  "Судсаар",
  "Булчинд тариур",
  "Арьс дор тариур",
  "Хэлний дор",
  "Гадаад хэрэглээ (тос/гель)",
  "Амьсгалаар",
  "Шүршүүрээр (небулайзер)",
  "Нүдний дусал",
  "Чихний дусал",
  "Хамрын дусал",
  "Хамрын шүршүүр",
  "Шулуун гэдсээр",
  "Арьсны наалт",
  "Хэвлийн хөндийд",
  "Нугасны суваганд",
] as const;

export type DrugRoute = (typeof DRUG_ROUTES)[number];

export interface TreatmentDrug {
  /** Эмийн нэр, хэлбэр, тун */
  nameFormDosage: string;
  /** Нийт тоо хэмжээ */
  totalQuantity?: number;
  /** Хэрэглэх арга */
  route?: string;
  /** Давтамж (өдөрт хэдэн удаа) */
  frequency?: number;
  /** Нэг удаанд (1 удаа хэдийг хэрэглэх) */
  perDose?: number;
  /** Хэрэглэх хугацаа (өдөр) */
  duration?: number;
  /** Тэмдэглэл */
  notes?: string;
}

export interface TreatmentRecord {
  id: string;
  patientId: string;
  drugs: TreatmentDrug[];
  recordedById: string;
  recordedByName: string;
  createdAt: string;
}

export interface CreateTreatmentInput {
  drugs: TreatmentDrug[];
}
