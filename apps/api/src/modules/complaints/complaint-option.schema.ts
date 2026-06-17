import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ComplaintOptionDocument = HydratedDocument<ComplaintOption>;

@Schema({ timestamps: true, collection: "complaint_options" })
export class ComplaintOption {
  @Prop({ type: String, enum: ["complaint", "location"], required: true })
  category!: "complaint" | "location";

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Number, default: 0 })
  order!: number;
}

export const ComplaintOptionSchema = SchemaFactory.createForClass(ComplaintOption);
ComplaintOptionSchema.index({ category: 1, order: 1 });
