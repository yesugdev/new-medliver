import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateLabTestDto {
  @IsOptional() @IsString() @MaxLength(20)    code?: string;
  @IsOptional() @IsString() @MaxLength(200)   name?: string;
  @IsOptional() @IsString() @MaxLength(200)   nameEn?: string;
  /** Live /lab-categories жагсаалттай нийцэж байгааг LabService шалгана */
  @IsOptional() @IsString() @MaxLength(50)    category?: string;
  @IsOptional() @IsString() @MaxLength(200)   testGroup?: string;
  @IsOptional() @IsString() @MaxLength(30)    unit?: string;
  @IsOptional() @IsNumber() @Min(0)           referenceMin?: number;
  @IsOptional() @IsNumber() @Min(0)           referenceMax?: number;
  @IsOptional() @IsString() @MaxLength(100)   referenceText?: string;
  @IsOptional() @IsNumber() @Min(0)           turnaroundHours?: number;
  @IsOptional() @IsEnum(["text","select"])    inputType?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsOptional() @IsNumber() @Min(0)           sortOrder?: number;
  @IsOptional() @IsBoolean()                  isActive?: boolean;
}
