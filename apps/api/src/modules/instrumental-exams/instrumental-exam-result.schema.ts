import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { INSTRUMENTAL_EXAM_TYPES } from "@his/shared";

export type InstrumentalExamResultDocument = HydratedDocument<InstrumentalExamResult>;

@Schema({ timestamps: true, collection: "instrumental_exam_results" })
export class InstrumentalExamResult {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, enum: INSTRUMENTAL_EXAM_TYPES, required: true })
  examType!: string;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: String, required: true })
  result!: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedById!: Types.ObjectId;

  @Prop({ type: String, required: true })
  recordedByName!: string;
}

export const InstrumentalExamResultSchema = SchemaFactory.createForClass(InstrumentalExamResult);
InstrumentalExamResultSchema.index({ patientId: 1, examType: 1, createdAt: -1 });
