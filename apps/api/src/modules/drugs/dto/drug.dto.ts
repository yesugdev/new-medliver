import { Type } from "class-transformer";
import {
  IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, IsDateString,
} from "class-validator";

export class CreateDrugDto {
  @IsOptional() @IsString() @MaxLength(50)
  code?: string;

  @IsString() @MinLength(1) @MaxLength(200)
  name!: string;

  @IsString() @MinLength(1) @MaxLength(100)
  form!: string;

  @IsString() @MinLength(1) @MaxLength(100)
  dosage!: string;

  @IsString() @MinLength(1) @MaxLength(50)
  unit!: string;

  @IsOptional() @IsString() @MaxLength(100)
  category?: string;

  @IsOptional() @IsString() @MaxLength(200)
  manufacturer?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  salePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber() @Min(0)
  stock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber() @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString() @MaxLength(500)
  description?: string;
}

export class UpdateDrugDto {
  @IsOptional() @IsString() @MaxLength(50)
  code?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  name?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(100)
  form?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(100)
  dosage?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(50)
  unit?: string;

  @IsOptional() @IsString() @MaxLength(100)
  category?: string;

  @IsOptional() @IsString() @MaxLength(200)
  manufacturer?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  salePrice?: number;

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

export class CreateBatchDto {
  @IsString() @MinLength(1) @MaxLength(100)
  batchNumber!: string;

  @IsDateString()
  expiryDate!: string;

  @Type(() => Number) @IsNumber() @Min(1)
  quantity!: number;

  @Type(() => Number) @IsNumber() @Min(0)
  costPrice!: number;

  @Type(() => Number) @IsNumber() @Min(0)
  salePrice!: number;

  @IsOptional() @IsString() @MaxLength(200)
  supplier?: string;

  @IsOptional() @IsDateString()
  receivedAt?: string;
}
