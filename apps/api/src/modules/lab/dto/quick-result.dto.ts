import { Type } from "class-transformer";
import {
  IsArray, IsDateString, IsMongoId, IsOptional, IsString, MaxLength,
  ValidateNested, ArrayMinSize,
} from "class-validator";

export class QuickResultItemDto {
  @IsMongoId()
  testId!: string;

  @IsString() @MaxLength(200)
  value!: string;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class QuickResultDto {
  @IsMongoId()
  patientId!: string;

  @IsOptional() @IsMongoId()
  visitId?: string;

  @IsOptional() @IsDateString()
  date?: string;

  @IsOptional() @IsString() @MaxLength(200)
  labName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuickResultItemDto)
  items!: QuickResultItemDto[];
}
