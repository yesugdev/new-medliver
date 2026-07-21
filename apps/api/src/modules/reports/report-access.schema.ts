import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ReportAccessDocument = HydratedDocument<ReportAccessEntity>;

/** Singleton — тайлан модулийг харах эрхтэй role-уудын жагсаалт */
@Schema({ timestamps: true, collection: "report_access_config" })
export class ReportAccessEntity {
  /** Admin-аас гадна нэмж хандах эрхтэй role-ууд */
  @Prop({ type: [String], default: [] })
  roles!: string[];
}

export const ReportAccessSchema = SchemaFactory.createForClass(ReportAccessEntity);
