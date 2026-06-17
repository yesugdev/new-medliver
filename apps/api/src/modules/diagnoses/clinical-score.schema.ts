import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ClinicalScoreDocument = HydratedDocument<ClinicalScore>;

@Schema({ timestamps: true, collection: "clinical_scores" })
export class ClinicalScore {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: String, enum: ["meld", "child_pugh", "qtc_framingham"], required: true })
  type!: string;

  @Prop({ type: Object, default: {} })
  inputs!: Record<string, any>;

  @Prop({ type: Number, required: true })
  score!: number;

  @Prop({ type: String })
  grade?: string;

  @Prop({ type: String, required: true })
  interpretation!: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedById!: Types.ObjectId;

  @Prop({ type: String, required: true })
  recordedByName!: string;
}

export const ClinicalScoreSchema = SchemaFactory.createForClass(ClinicalScore);
ClinicalScoreSchema.index({ patientId: 1, type: 1, createdAt: -1 });
