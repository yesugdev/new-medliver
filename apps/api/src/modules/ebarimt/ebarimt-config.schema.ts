import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type EbarimtConfigDocument = HydratedDocument<EbarimtConfigEntity>;

/** Singleton — PosAPI холболтын тохиргоо */
@Schema({ timestamps: true, collection: "ebarimt_config" })
export class EbarimtConfigEntity {
  @Prop({ type: Boolean, default: false })
  enabled!: boolean;

  @Prop({ type: String, default: "http://localhost:7080" })
  posApiUrl!: string;

  @Prop({ type: String, default: "" })
  merchantTin!: string;

  @Prop({ type: String, default: "" })
  districtCode!: string;

  @Prop({ type: String, default: "" })
  posNo!: string;

  @Prop({ type: String, default: "" })
  classificationCode!: string;
}

export const EbarimtConfigSchema = SchemaFactory.createForClass(EbarimtConfigEntity);
