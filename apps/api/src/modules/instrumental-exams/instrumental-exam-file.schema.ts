import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { INSTRUMENTAL_EXAM_TYPES } from "@his/shared";

export type InstrumentalExamFileDocument = HydratedDocument<InstrumentalExamFile>;

@Schema({ timestamps: true, collection: "instrumental_exam_files" })
export class InstrumentalExamFile {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, enum: INSTRUMENTAL_EXAM_TYPES, required: true })
  examType!: string;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: String, required: true })
  fileName!: string;

  @Prop({ type: Number, required: true })
  fileSize!: number;

  @Prop({ type: String, required: true })
  mimeType!: string;

  @Prop({ type: String, required: true })
  fileData!: string;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedById!: Types.ObjectId;

  @Prop({ type: String, required: true })
  recordedByName!: string;
}

export const InstrumentalExamFileSchema = SchemaFactory.createForClass(InstrumentalExamFile);
InstrumentalExamFileSchema.index({ patientId: 1, examType: 1, createdAt: -1 });
