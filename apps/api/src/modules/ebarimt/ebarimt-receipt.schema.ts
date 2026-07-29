import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type EbarimtReceiptDocument = HydratedDocument<EbarimtReceiptEntity>;

/** Гаргасан И-Баримт — нэхэмжлэл бүрт нэг (unique) */
@Schema({ timestamps: true, collection: "ebarimt_receipts" })
export class EbarimtReceiptEntity {
  @Prop({ type: Types.ObjectId, ref: "Invoice", required: true, unique: true, index: true })
  invoiceId!: Types.ObjectId;

  @Prop({ type: String })
  invoiceNumber?: string;

  /** PosAPI-гаас буцаасан баримтын ID (33 тэмдэгт) */
  @Prop({ type: String, required: true })
  ebarimtId!: string;

  @Prop({ type: String })
  lottery?: string;

  @Prop({ type: String })
  qrData?: string;

  @Prop({ type: Number, required: true })
  totalAmount!: number;

  @Prop({ type: Number, default: 0 })
  totalVAT!: number;

  @Prop({
    type: String,
    enum: ["B2C_RECEIPT", "B2B_RECEIPT", "B2C_INVOICE", "B2B_INVOICE"],
    default: "B2C_RECEIPT",
  })
  type!: string;

  /** PosAPI баримтын огноо — цуцлахад (DELETE) заавал хэрэгтэй */
  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: String, default: "SUCCESS" })
  status!: string;

  @Prop({ type: String })
  createdBy?: string;
}

export const EbarimtReceiptSchema = SchemaFactory.createForClass(EbarimtReceiptEntity);
