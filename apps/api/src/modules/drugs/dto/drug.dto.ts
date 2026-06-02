import { Type } from "class-transformer";
import {
  IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength,
} from "class-validator";

export class CreateDrugDto {
  @IsString() @MinLength(1) @MaxLength(200)
  name!: string;

  @IsString() @MinLength(1) @MaxLength(100)
  form!: string;

  @IsString() @MinLength(1) @MaxLength(100)
  dosage!: string;

  @IsString() @MinLength(1) @MaxLength(50)
  unit!: string;

  @Type(() => Number)
  @IsNumber() @Min(0)
  stock!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber() @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString() @MaxLength(500)
  description?: string;
}

export class UpdateDrugDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  name?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(100)
  form?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(100)
  dosage?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(50)
  unit?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  stock?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minStock?: number;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class AdjustStockDto {
  @Type(() => Number)
  @IsNumber()
  delta!: number;
}
