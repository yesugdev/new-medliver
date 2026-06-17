import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";

export class DiagnosisEntryDto {
  @IsOptional() @IsString() code?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePatientDiagnosisDto {
  @IsString() date!: string;

  @ValidateNested()
  @Type(() => DiagnosisEntryDto)
  primary!: DiagnosisEntryDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisEntryDto)
  comorbidities!: DiagnosisEntryDto[];
}
