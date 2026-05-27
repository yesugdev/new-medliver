import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class EmergencyContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  relation!: string;

  @IsString()
  @Matches(/^[0-9+\-\s()]{6,20}$/, { message: "Утасны дугаар буруу байна" })
  phone!: string;
}

export class CreatePatientDto {
  @IsString()
  @Matches(/^[А-ЯӨҮЁA-Z0-9]{10}$/i, {
    message: "Регистрийн дугаар 10 тэмдэгт байх ёстой",
  })
  registerNumber!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsEnum(["male", "female", "other"], {
    message: "Хүйс зөв сонгоно уу",
  })
  gender!: "male" | "female" | "other";

  @IsDateString({}, { message: "Төрсөн огноо буруу байна" })
  birthDate!: string;

  @IsString()
  @Matches(/^[0-9+\-\s()]{6,20}$/, { message: "Утасны дугаар буруу байна" })
  phone!: string;

  @IsOptional()
  @IsEmail({}, { message: "Имэйл буруу байна" })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  bloodType?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  chronicConditions?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  attendingDoctorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  attendingDoctorName?: string;
}
