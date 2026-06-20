import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type DrugBatchDocument = HydratedDocument<DrugBatchEntity>;

@Schema({ timestamps: true, collection: "drug_batches" })
export class DrugBatchEntity {
  @Prop({ type: Types.ObjectId, ref: "DrugEntity", required: true, index: true })
  drugId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  batchNumber!: string;

  @Prop({ type: Date, required: true, index: true })
  expiryDate!: Date;

  @Prop({ type: Number, required: true, min: 0 })
  quantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  initialQuantity!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  costPrice!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  salePrice!: number;

  @Prop({ type: String, trim: true })
  supplier?: string;

  @Prop({ type: Date, default: Date.now })
  receivedAt!: Date;
}

export const DrugBatchSchema = SchemaFactory.createForClass(DrugBatchEntity);
// FEFO: эхэлж дуусах нь түрүүлж олгогдоно
DrugBatchSchema.index({ drugId: 1, expiryDate: 1 });
