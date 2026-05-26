import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { softDeletePlugin } from "../../common/plugins/soft-delete.plugin";

export type VisitDocument = HydratedDocument<Visit>;
export type VisitStatusEnum = "in_progress" | "completed";

@Schema({ _id: false })
export class Vitals {
  @Prop({ type: Number }) temperature?: number;
  @Prop({ type: Number }) bloodPressureSystolic?: number;
  @Prop({ type: Number }) bloodPressureDiastolic?: number;
  @Prop({ type: Number }) heartRate?: number;
  @Prop({ type: Number }) respiratoryRate?: number;
  @Prop({ type: Number }) oxygenSaturation?: number;
  @Prop({ type: Number }) weight?: number;
  @Prop({ type: Number }) height?: number;
}
const VitalsSchema = SchemaFactory.createForClass(Vitals);

@Schema({ _id: false })
export class Prescription {
  @Prop({ type: String, required: true }) medication!: string;
  @Prop({ type: String, required: true }) dosage!: string;
  @Prop({ type: String, required: true }) frequency!: string;
  @Prop({ type: String, required: true }) duration!: string;
  @Prop({ type: String }) instructions?: string;
}
const PrescriptionSchema = SchemaFactory.createForClass(Prescription);

@Schema({ timestamps: true, collection: "visits" })
export class Visit {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  doctorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Appointment", index: true })
  appointmentId?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now, index: true })
  visitDate!: Date;

  @Prop({
    type: String,
    enum: ["in_progress", "completed"],
    default: "in_progress",
    index: true,
  })
  status!: VisitStatusEnum;

  @Prop({ type: String, trim: true }) chiefComplaint?: string;
  @Prop({ type: String, trim: true }) symptoms?: string;
  @Prop({ type: String, trim: true }) diagnosis?: string;
  @Prop({ type: String, trim: true }) treatment?: string;
  @Prop({ type: String, trim: true }) notes?: string;
  @Prop({ type: VitalsSchema }) vitals?: Vitals;
  @Prop({ type: [PrescriptionSchema], default: [] }) prescriptions?: Prescription[];
}

export const VisitSchema = SchemaFactory.createForClass(Visit);
VisitSchema.plugin(softDeletePlugin);
VisitSchema.index({ patientId: 1, visitDate: -1 });
