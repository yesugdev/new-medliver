import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type HospitalConfigDocument = HydratedDocument<HospitalConfigEntity>;

@Schema({ timestamps: true, collection: "hospital_config" })
export class HospitalConfigEntity {
  @Prop({ type: String, default: "MEDLIVER" })
  name!: string;

  @Prop({ type: String })
  logoBase64?: string;

  @Prop({ type: String })
  faviconBase64?: string;
}

export const HospitalConfigSchema = SchemaFactory.createForClass(HospitalConfigEntity);
