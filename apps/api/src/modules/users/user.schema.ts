import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ALL_ROLES, ROLES, type Role } from "@his/shared";
import { softDeletePlugin } from "../../common/plugins/soft-delete.plugin";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ type: String, required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, required: true, trim: true })
  fullName!: string;

  @Prop({
    type: String,
    required: true,
    enum: ALL_ROLES,
    default: ROLES.RECEPTION,
    index: true,
  })
  role!: Role;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: Date })
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(softDeletePlugin);
UserSchema.index({ email: 1 }, { unique: true });
