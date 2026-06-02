import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type TreatmentTaskDocument = HydratedDocument<TreatmentTaskEntity>;

@Schema({ timestamps: true, collection: "treatment_tasks" })
export class TreatmentTaskEntity {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  patientName!: string;

  @Prop({ type: String, required: true })
  patientCode!: string;

  @Prop({ type: String, required: true })
  drugName!: string;

  @Prop({ type: String })
  route?: string;

  @Prop({ type: Number })
  frequency?: number;

  @Prop({ type: Number })
  perDose?: number;

  @Prop({ type: String })
  notes?: string;

  /** YYYY-MM-DD */
  @Prop({ type: String, required: true, index: true })
  scheduledDate!: string;

  @Prop({ type: String, enum: ["pending", "done", "skipped"], default: "pending", index: true })
  status!: string;

  @Prop({ type: Date })
  doneAt?: Date;

  @Prop({ type: Types.ObjectId })
  doneById?: Types.ObjectId;

  @Prop({ type: String })
  doneByName?: string;

  @Prop({ type: String })
  doneNote?: string;

  @Prop({ type: Types.ObjectId })
  sourceRecordId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  createdById!: Types.ObjectId;

  @Prop({ type: String, required: true })
  createdByName!: string;
}

export const TreatmentTaskSchema = SchemaFactory.createForClass(TreatmentTaskEntity);
TreatmentTaskSchema.index({ patientId: 1, scheduledDate: 1 });
TreatmentTaskSchema.index({ scheduledDate: 1, status: 1 });
