import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DrugOptionDocument = HydratedDocument<DrugOptionEntity>;

@Schema({ timestamps: true, collection: "drug_options" })
export class DrugOptionEntity {
  @Prop({ type: String, enum: ["manufacturer", "category"], required: true, index: true })
  type!: "manufacturer" | "category";

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: Number, default: 0 })
  order!: number;
}

export const DrugOptionSchema = SchemaFactory.createForClass(DrugOptionEntity);
DrugOptionSchema.index({ type: 1, order: 1 });
