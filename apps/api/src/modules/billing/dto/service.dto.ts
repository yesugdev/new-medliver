import { PartialType } from "@nestjs/mapped-types";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateServiceDto {
  @IsString()
  @MaxLength(30)
  code!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEnum(["consultation", "procedure", "lab", "imaging", "medication", "other"])
  category!: "consultation" | "procedure" | "lab" | "imaging" | "medication" | "other";

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
