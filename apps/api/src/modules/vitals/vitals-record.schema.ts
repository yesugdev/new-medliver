import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type VitalsRecordDocument = HydratedDocument<VitalsRecord>;

@Schema({ timestamps: true, collection: "vitals_records" })
export class VitalsRecord {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedById!: Types.ObjectId;

  @Prop({ type: String, required: true })
  recordedByName!: string;

  @Prop({ type: Date, default: Date.now, index: true })
  recordedAt!: Date;

  @Prop({ type: Number }) temperature?: number;
  @Prop({ type: Number }) bloodPressureSystolic?: number;
  @Prop({ type: Number }) bloodPressureDiastolic?: number;
  @Prop({ type: Number }) heartRate?: number;
  @Prop({ type: Number }) respiratoryRate?: number;
  @Prop({ type: Number }) oxygenSaturation?: number;
  @Prop({ type: Number }) weight?: number;
  @Prop({ type: Number }) height?: number;
}

export const VitalsRecordSchema = SchemaFactory.createForClass(VitalsRecord);
VitalsRecordSchema.index({ patientId: 1, recordedAt: -1 });
