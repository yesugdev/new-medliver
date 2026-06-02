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
}

export const PrintConfigSchema = SchemaFactory.createForClass(PrintConfigEntity);
