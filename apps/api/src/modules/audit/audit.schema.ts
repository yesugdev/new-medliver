import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "audit_logs" })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: "User", index: true })
  actorId?: Types.ObjectId;

  @Prop({ type: String, index: true })
  actorEmail?: string;

  @Prop({ type: String, required: true, index: true })
  action!: string;

  @Prop({ type: String, index: true })
  resource?: string;

  @Prop({ type: String, index: true })
  resourceId?: string;

  @Prop({ type: Object })
  meta?: Record<string, unknown>;

  @Prop({ type: String })
  ipAddress?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
