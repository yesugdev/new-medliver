import { Type } from "class-transformer";
import {
  IsArray, IsMongoId, IsOptional, IsString, MaxLength,
  ValidateNested, ArrayMinSize,
} from "class-validator";

export class ResultItemDto {
  @IsMongoId()
  testId!: string;

  @IsString() @MaxLength(200)
  value!: string;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class RecordResultsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ResultItemDto)
  items!: ResultItemDto[];

  @IsOptional() @IsString() @MaxLength(200)
  labName?: string;
}
