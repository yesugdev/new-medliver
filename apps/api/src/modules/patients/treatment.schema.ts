import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type TreatmentDocument = HydratedDocument<Treatment>;

/** Single drug line in a treatment record */
@Schema({ _id: false })
export class TreatmentDrug {
  /** Эмийн нэр, хэлбэр, тун */
  @Prop({ type: String, required: true }) nameFormDosage!: string;
  /** Нийт тоо хэмжээ */
  @Prop({ type: Number, min: 0 })         totalQuantity?: number;
  /** Хэрэглэх арга */
  @Prop({ type: String })                 route?: string;
  /** Давтамж (өдөрт хэдэн удаа) */
  @Prop({ type: Number, min: 0 })         frequency?: number;
  /** Нэг удаанд (1 удаа хэдийг хэрэглэх) */
  @Prop({ type: Number, min: 0 })         perDose?: number;
  /** Хэрэглэх хугацаа (өдөр) */
  @Prop({ type: Number, min: 0 })         duration?: number;
  /** Тэмдэглэл */
  @Prop({ type: String, trim: true })     notes?: string;
}
const TreatmentDrugSchema = SchemaFactory.createForClass(TreatmentDrug);

@Schema({ timestamps: true, collection: "treatments" })
export class Treatment {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: [TreatmentDrugSchema], default: [] })
  drugs!: TreatmentDrug[];

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedById!: Types.ObjectId;

  @Prop({ type: String, required: true })
  recordedByName!: string;
}

export const TreatmentSchema = SchemaFactory.createForClass(Treatment);
TreatmentSchema.index({ patientId: 1, createdAt: -1 });
