import {
  IsArray, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min,
} from "class-validator";

const CATEGORIES = [
  "hematology","biochemistry","urinalysis","microbiology",
  "immunology","hormones","rapid_tests","viral_load","coagulogram","other",
] as const;

export class CreateLabTestDto {
  @IsString() @MaxLength(20)    code!: string;
  @IsString() @MaxLength(200)   name!: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsEnum(CATEGORIES)           category!: string;
  @IsOptional() @IsString() @MaxLength(200) testGroup?: string;
  @IsOptional() @IsString() @MaxLength(30)  unit?: string;
  @IsOptional() @IsNumber() @Min(0)         referenceMin?: number;
  @IsOptional() @IsNumber() @Min(0)         referenceMax?: number;
  @IsOptional() @IsString() @MaxLength(100) referenceText?: string;
  @IsOptional() @IsNumber() @Min(0)         turnaroundHours?: number;
  @IsOptional() @IsEnum(["text","select"])  inputType?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsOptional() @IsNumber() @Min(0)         sortOrder?: number;
}
