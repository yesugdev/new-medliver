import { PartialType } from "@nestjs/mapped-types";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ALL_ROLES, type Role } from "@his/shared";

export class CreateUserDto {
  @IsEmail({}, { message: "Имэйл буруу байна" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Нууц үг 6-аас доошгүй тэмдэгт" })
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName!: string;

  @IsIn(ALL_ROLES, { message: "Role буруу" })
  role!: Role;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) fullName?: string;
  @IsOptional() @IsIn(ALL_ROLES) role?: Role;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6, { message: "Нууц үг 6-аас доошгүй тэмдэгт" })
  password!: string;
}

export class ListUsersDto {
  @IsOptional() @IsIn(ALL_ROLES) role?: Role;
  @IsOptional() @IsString() search?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) fullName?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsString() avatar?: string;
}

export class ChangePasswordDto {
  @IsString() @MinLength(6, { message: "Одоогийн нууц үг буруу" }) currentPassword!: string;
  @IsString() @MinLength(6, { message: "Нууц үг 6-аас доошгүй тэмдэгт" }) newPassword!: string;
}
