import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PrintConfigDocument = HydratedDocument<PrintConfigEntity>;

@Schema({ timestamps: true, collection: "print_config" })
export class PrintConfigEntity {
  @Prop({ type: String, default: "MEDLIVER" })
  orgName!: string;

  @Prop({ type: String })
  orgSubtitle?: string;

  @Prop({ type: String })
  orgAddress?: string;

  @Prop({ type: String })
  orgPhone?: string;

  @Prop({ type: String })
  orgEmail?: string;

  @Prop({ type: String })
  logoUrl?: string;

  @Prop({ type: Boolean, default: false })
  showLogo!: boolean;

  @Prop({ type: String })
  stampUrl?: string;

  @Prop({ type: Boolean, default: false })
  showStamp!: boolean;

  @Prop({ type: String, default: "#1e293b" })
  headerBgColor!: string;

  @Prop({ type: String, default: "#ffffff" })
  headerTextColor!: string;

  @Prop({ type: Number, default: 13 })
  fontSize!: number;

  @Prop({ type: String, enum: ["A4", "A5"], default: "A4" })
  pageSize!: string;

  @Prop({ type: String, enum: ["portrait", "landscape"], default: "portrait" })
  pageOrientation!: string;

  @Prop({ type: String })
  footerNote?: string;

  @Prop({ type: Boolean, default: true })  showPatientCode!: boolean;
  @Prop({ type: Boolean, default: true })  showPatientRegister!: boolean;
  @Prop({ type: Boolean, default: true })  showPatientAge!: boolean;
  @Prop({ type: Boolean, default: true })  showPatientGender!: boolean;
  @Prop({ type: Boolean, default: true })  showPatientPhone!: boolean;
  @Prop({ type: Boolean, default: false }) showPatientAddress!: boolean;
  @Prop({ type: Boolean, default: false }) showPatientBloodType!: boolean;
  @Prop({ type: Boolean, default: false }) showPatientBirthDate!: boolean;
  @Prop({ type: Boolean, default: false }) showPatientDoctor!: boolean;
}

export const PrintConfigSchema = SchemaFactory.createForClass(PrintConfigEntity);
