import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { softDeletePlugin } from "../../common/plugins/soft-delete.plugin";

export type ServiceItemDocument = HydratedDocument<ServiceItem>;

export type ServiceCategoryEnum =
  | "consultation"
  | "procedure"
  | "lab"
  | "imaging"
  | "medication"
  | "other";

@Schema({ timestamps: true, collection: "service_items" })
export class ServiceItem {
  @Prop({ type: String, required: true, unique: true, trim: true, index: true })
  code!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    enum: ["consultation", "procedure", "lab", "imaging", "medication", "other"],
    default: "other",
    index: true,
  })
  category!: ServiceCategoryEnum;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

export const ServiceItemSchema = SchemaFactory.createForClass(ServiceItem);
ServiceItemSchema.plugin(softDeletePlugin);
