import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { softDeletePlugin } from "../../common/plugins/soft-delete.plugin";

export type LabOrderDocument = HydratedDocument<LabOrder>;

/* ─── Embedded item ─────────────────────────────────────────────────── */
@Schema({ _id: false })
export class LabOrderItem {
  @Prop({ type: Types.ObjectId, required: true }) testId!: Types.ObjectId;
  @Prop({ type: String, required: true })         testCode!: string;
  @Prop({ type: String, required: true })         testName!: string;
  @Prop({ type: String })                         testGroup?: string;
  @Prop({ type: String })                         unit?: string;
  @Prop({ type: String, enum: ["text","select"], default: "text" }) inputType!: string;
  @Prop({ type: [String], default: [] })          options?: string[];
  @Prop({ type: Number })                         referenceMin?: number;
  @Prop({ type: Number })                         referenceMax?: number;
  @Prop({ type: String })                         referenceText?: string;

  @Prop({ type: String, enum: ["ordered","resulted","cancelled"], default: "ordered" })
  status!: string;

  @Prop({ type: String })  value?: string;
  @Prop({ type: String,
    enum: ["normal","low","high","critical_low","critical_high","abnormal"] })
  interpretation?: string;

  @Prop({ type: String })          notes?: string;
  @Prop({ type: Date })            resultedAt?: Date;
  @Prop({ type: Types.ObjectId })  resultedById?: Types.ObjectId;
  @Prop({ type: String })          resultedByName?: string;
}
const LabOrderItemSchema = SchemaFactory.createForClass(LabOrderItem);

/* ─── Order ─────────────────────────────────────────────────────────── */
@Schema({ timestamps: true, collection: "lab_orders" })
export class LabOrder {
  @Prop({ type: String, required: true, unique: true, index: true })
  orderNumber!: string;

  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  doctorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Visit", index: true })
  visitId?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now, index: true })
  orderedAt!: Date;

  @Prop({
    type: String,
    enum: ["ordered","partial","completed","cancelled"],
    default: "ordered",
    index: true,
  })
  status!: string;

  @Prop({ type: String, enum: ["routine","urgent","stat"], default: "routine" })
  priority!: string;

  @Prop({ type: String, trim: true })
  clinicalNote?: string;

  @Prop({ type: [LabOrderItemSchema], default: [] })
  items!: LabOrderItem[];
}

export const LabOrderSchema = SchemaFactory.createForClass(LabOrder);
LabOrderSchema.plugin(softDeletePlugin);
LabOrderSchema.index({ patientId: 1, orderedAt: -1 });
LabOrderSchema.index({ doctorId: 1, orderedAt: -1 });
LabOrderSchema.index({ status: 1, orderedAt: -1 });
