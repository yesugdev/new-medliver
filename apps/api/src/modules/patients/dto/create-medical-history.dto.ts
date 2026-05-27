import { IsArray, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateMedicalHistoryDto {
  @IsArray() @IsString({ each: true }) symptoms!: string[];
  @IsArray() @IsString({ each: true }) diagnoses!: string[];

  @IsOptional() @IsString() diagnosedAt?: string;
  @IsOptional() @IsString() @MaxLength(500) diagnosedWhere?: string;
  @IsOptional() @IsString() @MaxLength(500) previousClinic?: string;

  @IsArray() @IsString({ each: true }) treatmentTypes!: string[];

  @IsOptional() @IsString() @MaxLength(2000) treatmentResult?: string;
  @IsOptional() @IsNumber() @Min(0) diseaseDuration?: number;
  @IsOptional() @IsString() @MaxLength(2000) diseaseStartCause?: string;
  @IsOptional() @IsString() @MaxLength(2000) testsPerformed?: string;
  @IsOptional() @IsString() @MaxLength(2000) progressBeforeAdmission?: string;
  @IsOptional() @IsString() @MaxLength(2000) initialSymptoms?: string;
  @IsOptional() @IsNumber() @Min(0) annualFlareCount?: number;
  @IsOptional() @IsString() @MaxLength(2000) flaresCause?: string;
  @IsOptional() @IsString() @MaxLength(2000) flaresPrevention?: string;
  @IsOptional() @IsString() @MaxLength(2000) additionalInfo?: string;
}
