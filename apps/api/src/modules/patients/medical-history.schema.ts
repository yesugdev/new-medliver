import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type MedicalHistoryDocument = HydratedDocument<MedicalHistory>;

@Schema({ timestamps: true, collection: "medical_histories" })
export class MedicalHistory {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  /** Илэрсэн зовиур */
  @Prop({ type: [String], default: [] })
  symptoms!: string[];

  /** Илэрсэн онош */
  @Prop({ type: [String], default: [] })
  diagnoses!: string[];

  /** Анх хэзээ оношлогдсон бэ? */
  @Prop({ type: String })
  diagnosedAt?: string;

  /** Анх хаана оношлогдсон бэ? */
  @Prop({ type: String, trim: true })
  diagnosedWhere?: string;

  /** Энд ирэхээс өмнө хаана үзүүлсэн бэ? */
  @Prop({ type: String, trim: true })
  previousClinic?: string;

  /** Ямар эмчилгээ хийлгэсэн бэ? — "medication" | "non_medication" | "none" */
  @Prop({ type: [String], default: [] })
  treatmentTypes!: string[];

  /** Эмчилгээний үр дүн ямар байсан бэ? */
  @Prop({ type: String, trim: true })
  treatmentResult?: string;

  /** Өвчин хэзээ эхэлсэн бэ? (жил/сар/хоног тоогоор) */
  @Prop({ type: Number })
  diseaseDuration?: number;

  /** Өвчний эхлэлийг юутай холбоотой гэж бодож байна вэ? */
  @Prop({ type: String, trim: true })
  diseaseStartCause?: string;

  /** Ямар шинжилгээ хийлгэсэн бэ? */
  @Prop({ type: String, trim: true })
  testsPerformed?: string;

  /** Эмнэлэгт ирэх хүртэл өвчний явц ямар байсан бэ? */
  @Prop({ type: String, trim: true })
  progressBeforeAdmission?: string;

  /** Анх ямар зовууриар илэрсэн бэ? */
  @Prop({ type: String, trim: true })
  initialSymptoms?: string;

  /** Жилд хэдэн удаа сэдэрдэг вэ? */
  @Prop({ type: Number })
  annualFlareCount?: number;

  /** Өвчний сэдрэлийг юутай холбоотой гэж боддог вэ? */
  @Prop({ type: String, trim: true })
  flaresCause?: string;

  /** Сэдрэлээс урьдчилан сэргийлэх ямар арга хэмжээ авдаг вэ? */
  @Prop({ type: String, trim: true })
  flaresPrevention?: string;

  /** Нэмэлт мэдээлэл */
  @Prop({ type: String, trim: true })
  additionalInfo?: string;

  /** Бүртгэсэн хэрэглэгч */
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedById!: Types.ObjectId;

  @Prop({ type: String, required: true })
  recordedByName!: string;
}

export const MedicalHistorySchema = SchemaFactory.createForClass(MedicalHistory);
MedicalHistorySchema.index({ patientId: 1, createdAt: -1 });
