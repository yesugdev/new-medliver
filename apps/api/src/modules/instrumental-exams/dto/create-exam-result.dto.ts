import { IsEnum, IsOptional, IsString } from "class-validator";
import { INSTRUMENTAL_EXAM_TYPES, type InstrumentalExamType } from "@his/shared";

export class CreateExamResultDto {
  @IsEnum(INSTRUMENTAL_EXAM_TYPES)
  examType!: InstrumentalExamType;

  @IsString() date!: string;
  @IsString() result!: string;
  @IsOptional() @IsString() notes?: string;
}
