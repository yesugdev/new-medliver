import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";

export class ComplaintLineDto {
  @IsString() complaintName!: string;
  @IsString() locationName!: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreateComplaintDto {
  @IsString() date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComplaintLineDto)
  lines!: ComplaintLineDto[];
}
