export type MedicalTreatmentType = "medication" | "non_medication" | "none";

export interface MedicalHistoryRecord {
  id: string;
  patientId: string;
  /** Илэрсэн зовиур */
  symptoms: string[];
  /** Илэрсэн онош */
  diagnoses: string[];
  /** Анх хэзээ оношлогдсон бэ? */
  diagnosedAt?: string;
  /** Анх хаана оношлогдсон бэ? */
  diagnosedWhere?: string;
  /** Энд ирэхээс өмнө хаана үзүүлсэн бэ? */
  previousClinic?: string;
  /** Ямар эмчилгээ хийлгэсэн бэ? */
  treatmentTypes: string[];
  /** Эмчилгээний үр дүн */
  treatmentResult?: string;
  /** Өвчин хэзээ эхэлсэн бэ? (тоо) */
  diseaseDuration?: number;
  /** Өвчний эхлэлийг юутай холбоотой */
  diseaseStartCause?: string;
  /** Ямар шинжилгээ хийлгэсэн бэ? */
  testsPerformed?: string;
  /** Эмнэлэгт ирэх хүртэл өвчний явц */
  progressBeforeAdmission?: string;
  /** Анх ямар зовууриар илэрсэн бэ? */
  initialSymptoms?: string;
  /** Жилд хэдэн удаа сэдэрдэг вэ? */
  annualFlareCount?: number;
  /** Өвчний сэдрэлийг юутай холбоотой */
  flaresCause?: string;
  /** Сэдрэлээс урьдчилан сэргийлэх арга хэмжээ */
  flaresPrevention?: string;
  /** Нэмэлт мэдээлэл */
  additionalInfo?: string;
  recordedById: string;
  recordedByName: string;
  createdAt: string;
}

export interface CreateMedicalHistoryInput {
  symptoms: string[];
  diagnoses: string[];
  diagnosedAt?: string;
  diagnosedWhere?: string;
  previousClinic?: string;
  treatmentTypes: string[];
  treatmentResult?: string;
  diseaseDuration?: number;
  diseaseStartCause?: string;
  testsPerformed?: string;
  progressBeforeAdmission?: string;
  initialSymptoms?: string;
  annualFlareCount?: number;
  flaresCause?: string;
  flaresPrevention?: string;
  additionalInfo?: string;
}
