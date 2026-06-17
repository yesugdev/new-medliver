import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PatientDiagnosisDocument = HydratedDocument<PatientDiagnosis>;

@Schema({ timestamps: true, collection: "patient_diagnoses" })
export class PatientDiagnosis {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: Object, required: true })
  primary!: { code?: string; name: string; notes?: string };

  @Prop({ type: [Object], default: [] })
  comorbidities!: Array<{ code?: string; name: string; notes?: string }>;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedById!: Types.ObjectId;

  @Prop({ type: String, required: true })
  recordedByName!: string;
}

export const PatientDiagnosisSchema = SchemaFactory.createForClass(PatientDiagnosis);
PatientDiagnosisSchema.index({ patientId: 1, createdAt: -1 });
