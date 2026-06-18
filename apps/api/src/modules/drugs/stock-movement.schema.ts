import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type StockMovementDocument = HydratedDocument<StockMovementEntity>;

export type StockMovementTypeEnum = "in" | "out" | "adjust" | "expire";

@Schema({ timestamps: true, collection: "stock_movements" })
export class StockMovementEntity {
  @Prop({ type: Types.ObjectId, ref: "DrugEntity", required: true, index: true })
  drugId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "DrugBatchEntity" })
  batchId?: Types.ObjectId;

  @Prop({ type: String, enum: ["in", "out", "adjust", "expire"], required: true })
  type!: StockMovementTypeEnum;

  /** Тэмдэгтэй: орлого +, зарлага − */
  @Prop({ type: Number, required: true })
  quantity!: number;

  @Prop({ type: String, trim: true })
  reason?: string;

  /** Холбогдол: treatment / invoice гэх мэт */
  @Prop({ type: String })
  refType?: string;

  @Prop({ type: String, index: true })
  refId?: string;

  @Prop({ type: String })
  createdBy?: string;

  @Prop({ type: String })
  createdByName?: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovementEntity);
StockMovementSchema.index({ drugId: 1, createdAt: -1 });
StockMovementSchema.index({ refId: 1 });
