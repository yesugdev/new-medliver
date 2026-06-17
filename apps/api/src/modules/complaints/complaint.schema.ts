import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ComplaintDocument = HydratedDocument<Complaint>;

@Schema({ _id: false })
class ComplaintLine {
  @Prop({ type: String, default: "" })
  complaintName!: string;

  @Prop({ type: String, default: "" })
  locationName!: string;

  @Prop({ type: String, default: "" })
  notes!: string;
}

@Schema({ timestamps: true, collection: "patient_complaints" })
export class Complaint {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  doctorId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  doctorName!: string;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: [ComplaintLine], default: [] })
  lines!: ComplaintLine[];
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);
ComplaintSchema.index({ patientId: 1, createdAt: -1 });
