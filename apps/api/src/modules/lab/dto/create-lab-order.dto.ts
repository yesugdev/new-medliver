import {
  IsArray, IsEnum, IsMongoId, IsOptional, IsString, MaxLength, ArrayMinSize,
} from "class-validator";

export class CreateLabOrderDto {
  @IsMongoId()
  patientId!: string;

  @IsOptional() @IsMongoId()
  visitId?: string;

  @IsOptional()
  @IsEnum(["routine","urgent","stat"])
  priority?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  clinicalNote?: string;

  @IsOptional() @IsString() @MaxLength(200)
  labName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  testIds!: string[];
}
