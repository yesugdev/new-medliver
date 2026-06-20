import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DrugDocument = HydratedDocument<DrugEntity>;

@Schema({ timestamps: true, collection: "drugs" })
export class DrugEntity {
  @Prop({ type: String, trim: true, index: true })
  code?: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  name!: string;

  @Prop({ type: String, required: true, trim: true })
  form!: string;

  @Prop({ type: String, required: true, trim: true })
  dosage!: string;

  @Prop({ type: String, required: true, trim: true })
  unit!: string;

  @Prop({ type: String, trim: true, index: true })
  category?: string;

  @Prop({ type: String, trim: true })
  manufacturer?: string;

  @Prop({ type: Number, default: 0, min: 0 })
  salePrice!: number;

  @Prop({ type: Number, required: true, default: 0 })
  stock!: number;

  @Prop({ type: Number, default: 0 })
  minStock!: number;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;
}

export const DrugSchema = SchemaFactory.createForClass(DrugEntity);
DrugSchema.index({ name: "text" });
DrugSchema.index({ createdAt: -1 });
