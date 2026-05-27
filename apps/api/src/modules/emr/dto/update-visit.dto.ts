import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class VitalsDto {
  @IsOptional() @IsNumber() @Min(0) temperature?: number;
  @IsOptional() @IsNumber() @Min(0) bloodPressureSystolic?: number;
  @IsOptional() @IsNumber() @Min(0) bloodPressureDiastolic?: number;
  @IsOptional() @IsNumber() @Min(0) heartRate?: number;
  @IsOptional() @IsNumber() @Min(0) respiratoryRate?: number;
  @IsOptional() @IsNumber() @Min(0) oxygenSaturation?: number;
  @IsOptional() @IsNumber() @Min(0) weight?: number;
  @IsOptional() @IsNumber() @Min(0) height?: number;
}

export class PrescriptionDto {
  @IsString() @MaxLength(200) medication!: string;
  @IsString() @MaxLength(100) dosage!: string;
  @IsString() @MaxLength(100) frequency!: string;
  @IsString() @MaxLength(100) duration!: string;
  @IsOptional() @IsString() @MaxLength(500) instructions?: string;
}

export class UpdateVisitDto {
  @IsOptional() @IsString() @MaxLength(1000) chiefComplaint?: string;
  @IsOptional() @IsString() @MaxLength(2000) symptoms?: string;
  @IsOptional() @IsString() @MaxLength(2000) diagnosis?: string;
  @IsOptional() @IsString() @MaxLength(2000) treatment?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => VitalsDto)
  vitals?: VitalsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionDto)
  prescriptions?: PrescriptionDto[];

  @IsOptional()
  @IsEnum(["in_progress", "completed"])
  status?: "in_progress" | "completed";

  @IsOptional()
  clinicalNotes?: Record<string, Record<string, any>>;
}
