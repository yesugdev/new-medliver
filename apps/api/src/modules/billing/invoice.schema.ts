import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { softDeletePlugin } from "../../common/plugins/soft-delete.plugin";

export type InvoiceDocument = HydratedDocument<Invoice>;

export type InvoiceStatusEnum = "draft" | "issued" | "partial" | "paid" | "cancelled";
export type PaymentMethodEnum = "cash" | "card" | "transfer" | "insurance";

@Schema({ _id: false })
export class InvoiceLineItem {
  @Prop({ type: Types.ObjectId, ref: "ServiceItem" }) serviceId?: Types.ObjectId;
  @Prop({ type: String }) code?: string;
  @Prop({ type: String, required: true }) name!: string;
  @Prop({ type: String }) category?: string;
  @Prop({ type: Number, required: true, min: 0 }) quantity!: number;
  @Prop({ type: Number, required: true, min: 0 }) unitPrice!: number;
  @Prop({ type: Number, required: true, min: 0 }) total!: number;
}
const LineItemSchema = SchemaFactory.createForClass(InvoiceLineItem);

@Schema({ _id: false })
export class PaymentEntry {
  @Prop({ type: Number, required: true, min: 0 }) amount!: number;
  @Prop({
    type: String,
    enum: ["cash", "card", "transfer", "insurance"],
    required: true,
  })
  method!: PaymentMethodEnum;
  @Prop({ type: Date, required: true }) paidAt!: Date;
  @Prop({ type: String }) receivedBy?: string;
  @Prop({ type: String }) note?: string;
}
const PaymentEntrySchema = SchemaFactory.createForClass(PaymentEntry);

@Schema({ timestamps: true, collection: "invoices" })
export class Invoice {
  @Prop({ type: String, required: true, unique: true, index: true })
  invoiceNumber!: string;

  @Prop({ type: Types.ObjectId, ref: "Patient", required: true, index: true })
  patientId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Visit", index: true })
  visitId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Treatment", index: true })
  sourceTreatmentId?: Types.ObjectId;

  @Prop({ type: [LineItemSchema], required: true })
  items!: InvoiceLineItem[];

  @Prop({ type: Number, required: true, min: 0 }) subtotal!: number;
  @Prop({ type: Number, default: 0, min: 0 }) discount!: number;
  @Prop({ type: Number, default: 0, min: 0 }) vat!: number;
  @Prop({ type: Number, default: 0, min: 0 }) vatRate!: number;
  @Prop({ type: Number, required: true, min: 0 }) total!: number;
  @Prop({ type: Number, default: 0, min: 0 }) paid!: number;
  @Prop({ type: Number, required: true }) balance!: number;

  @Prop({
    type: String,
    enum: ["draft", "issued", "partial", "paid", "cancelled"],
    default: "issued",
    index: true,
  })
  status!: InvoiceStatusEnum;

  @Prop({ type: [PaymentEntrySchema], default: [] }) payments!: PaymentEntry[];

  @Prop({ type: Date, default: Date.now, index: true }) issuedAt!: Date;
  @Prop({ type: String }) createdBy?: string;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.plugin(softDeletePlugin);
InvoiceSchema.index({ patientId: 1, issuedAt: -1 });
