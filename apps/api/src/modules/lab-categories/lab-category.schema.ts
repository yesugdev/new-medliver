import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type LabCategoryDocument = HydratedDocument<LabCategoryEntity>;

@Schema({ timestamps: true, collection: "lab_categories" })
export class LabCategoryEntity {
  /** LabTest.category-той тааруулах түлхүүр — үүсгэсний дараа өөрчлөгдөхгүй */
  @Prop({ type: String, required: true, unique: true, trim: true, index: true })
  key!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  nameEn?: string;

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;

  /** Seed-ээр үүссэн систем ангилал — устгах боломжгүй */
  @Prop({ type: Boolean, default: false })
  isDefault!: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;
}

export const LabCategorySchema = SchemaFactory.createForClass(LabCategoryEntity);
LabCategorySchema.index({ sortOrder: 1 });
