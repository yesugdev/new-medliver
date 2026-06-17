import { IsEnum, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class CreateClinicalScoreDto {
  @IsString() date!: string;

  @IsEnum(["meld", "child_pugh", "qtc_framingham"])
  type!: "meld" | "child_pugh" | "qtc_framingham";

  @IsObject() inputs!: Record<string, number | string>;

  @IsNumber() score!: number;

  @IsOptional() @IsString() grade?: string;

  @IsString() interpretation!: string;
}
