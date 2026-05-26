import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { softDeletePlugin } from "../../common/plugins/soft-delete.plugin";

export type AppointmentDocument = HydratedDocument<Appointment>;

export type AppointmentStatusEnum =
  | "scheduled"
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type AppointmentTypeEnum = "consultation" | "follow_up" | "walk_in" | "emergency";

@Schema({ timestamps: true, collection: "appointments" })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  doctorId!: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  scheduledAt!: Date;

  @Prop({ type: Number, default: 20 })
  durationMinutes!: number;

  @Prop({
    type: String,
    enum: ["consultation", "follow_up", "walk_in", "emergency"],
    default: "consultation",
  })
  type!: AppointmentTypeEnum;

  @Prop({
    type: String,
    enum: ["scheduled", "waiting", "in_progress", "completed", "cancelled", "no_show"],
    default: "scheduled",
    index: true,
  })
  status!: AppointmentStatusEnum;

  @Prop({ type: Number, index: true })
  queueNumber?: number;

  @Prop({ type: String, trim: true })
  reason?: string;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({ type: String, index: true })
  createdBy?: string;

  @Prop({ type: Date })
  calledAt?: Date;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.plugin(softDeletePlugin);
AppointmentSchema.index({ scheduledAt: 1, doctorId: 1 });
AppointmentSchema.index({ doctorId: 1, status: 1, scheduledAt: 1 });
