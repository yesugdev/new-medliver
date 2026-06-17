import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { INSTRUMENTAL_EXAM_TYPES, type InstrumentalExamType } from "@his/shared";

export class CreateExamFileDto {
  @IsEnum(INSTRUMENTAL_EXAM_TYPES)
  examType!: InstrumentalExamType;

  @IsString()  date!: string;
  @IsString()  fileName!: string;
  @IsNumber()  fileSize!: number;
  @IsString()  mimeType!: string;
  @IsString()  fileData!: string;
  @IsOptional() @IsString() notes?: string;
}
