import { Type } from "class-transformer";
import {
  IsDateString, IsEnum, IsInt, IsMongoId, IsOptional, Min,
} from "class-validator";

export class ListOrdersDto {
  @IsOptional() @IsMongoId()             patientId?: string;
  @IsOptional() @IsMongoId()             doctorId?: string;
  @IsOptional() @IsDateString()          from?: string;
  @IsOptional() @IsDateString()          to?: string;
  @IsOptional() @IsEnum(["ordered","partial","completed","cancelled"]) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number;
}
