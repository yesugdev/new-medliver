import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { softDeletePlugin } from "../../common/plugins/soft-delete.plugin";

export type LabTestDocument = HydratedDocument<LabTest>;

export type LabCategoryEnum =
  | "hematology" | "biochemistry" | "urinalysis"
  | "microbiology" | "immunology" | "hormones"
  | "rapid_tests" | "viral_load" | "coagulogram" | "other";

@Schema({ timestamps: true, collection: "lab_tests" })
export class LabTest {
  @Prop({ type: String, required: true, unique: true, trim: true, index: true })
  code!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  nameEn?: string;

  @Prop({
    type: String,
    enum: ["hematology","biochemistry","urinalysis","microbiology","immunology","hormones","rapid_tests","viral_load","coagulogram","other"],
    default: "other",
    index: true,
  })
  category!: LabCategoryEnum;

  @Prop({ type: String, trim: true })
  testGroup?: string;

  @Prop({ type: String, trim: true })
  unit?: string;

  @Prop({ type: Number })
  referenceMin?: number;

  @Prop({ type: Number })
  referenceMax?: number;

  @Prop({ type: String, trim: true })
  referenceText?: string;

  @Prop({ type: Number })
  turnaroundHours?: number;

  @Prop({ type: String, enum: ["text","select"], default: "text" })
  inputType!: string;

  @Prop({ type: [String], default: [] })
  options?: string[];

  @Prop({ type: Number, default: 0 })
  sortOrder?: number;

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;
}

export const LabTestSchema = SchemaFactory.createForClass(LabTest);
LabTestSchema.plugin(softDeletePlugin);
LabTestSchema.index({ category: 1, isActive: 1 });
