import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateTreatmentTaskDto {
  @IsString() patientId!: string;
  @IsString() drugName!: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) frequency?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) perDose?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() scheduledDate?: string;
}

export class UpdateTreatmentTaskDto {
  @IsEnum(["pending", "done", "skipped"]) status!: "pending" | "done" | "skipped";
  @IsOptional() @IsString() doneNote?: string;
}

export class ListTreatmentTasksDto {
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() patientId?: string;
  @IsOptional() @IsEnum(["pending", "done", "skipped"]) status?: string;
  @IsOptional() @IsString() q?: string;
}
