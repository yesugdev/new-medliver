import { Type } from "class-transformer";
import {
  IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString,
  MaxLength, Min, ValidateNested,
} from "class-validator";

export class TreatmentDrugDto {
  @IsOptional() @IsString()      drugId?: string;
  @IsString() @MaxLength(500)    nameFormDosage!: string;
  @IsOptional() @IsNumber() @Min(0) totalQuantity?: number;
  @IsOptional() @IsString()      route?: string;
  @IsOptional() @IsNumber() @Min(0) frequency?: number;
  @IsOptional() @IsNumber() @Min(0) perDose?: number;
  @IsOptional() @IsNumber() @Min(0) duration?: number;
  @IsOptional() @IsArray() @IsDateString({}, { each: true }) scheduleDates?: string[];
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

export class CreateTreatmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentDrugDto)
  drugs!: TreatmentDrugDto[];

  @IsOptional()
  @IsBoolean()
  addToTasks?: boolean;
}
