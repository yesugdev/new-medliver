import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { softDeletePlugin } from "../../common/plugins/soft-delete.plugin";

export type PatientDocument = HydratedDocument<Patient>;
export type GenderEnum = "male" | "female" | "other";

@Schema({ _id: false })
export class EmergencyContact {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, trim: true })
  relation!: string;

  @Prop({ type: String, required: true, trim: true })
  phone!: string;
}
const EmergencyContactSchema = SchemaFactory.createForClass(EmergencyContact);

@Schema({ timestamps: true, collection: "patients" })
export class Patient {
  @Prop({ type: String, required: true, unique: true, index: true })
  patientCode!: string;

  @Prop({ type: String, required: true, trim: true, uppercase: true, index: true })
  registerNumber!: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  lastName!: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  firstName!: string;

  @Prop({ type: String, required: true, enum: ["male", "female", "other"] })
  gender!: GenderEnum;

  @Prop({ type: Date, required: true })
  birthDate!: Date;

  @Prop({ type: String, required: true, trim: true, index: true })
  phone!: string;

  @Prop({ type: String, trim: true, lowercase: true })
  email?: string;

  @Prop({ type: String, trim: true })
  address?: string;

  @Prop({ type: String, trim: true })
  bloodType?: string;

  @Prop({ type: [String], default: [] })
  allergies?: string[];

  @Prop({ type: [String], default: [] })
  chronicConditions?: string[];

  @Prop({ type: EmergencyContactSchema })
  emergencyContact?: EmergencyContact;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({ type: String, index: true })
  createdBy?: string;

  @Prop({ type: String, index: true })
  attendingDoctorId?: string;

  @Prop({ type: String, trim: true })
  attendingDoctorName?: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
PatientSchema.plugin(softDeletePlugin);

PatientSchema.index({ lastName: "text", firstName: "text", phone: "text", registerNumber: "text", patientCode: "text" });
PatientSchema.index({ registerNumber: 1 });
PatientSchema.index({ patientCode: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ createdAt: -1 });
