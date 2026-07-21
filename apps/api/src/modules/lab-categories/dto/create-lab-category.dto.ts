import { IsOptional, IsString, IsNumber, MaxLength, Matches } from "class-validator";

export class CreateLabCategoryDto {
  @IsString() @MaxLength(50)
  @Matches(/^[a-z0-9_]+$/, { message: "key нь зөвхөн жижиг үсэг, тоо, доогуур зураас (_) агуулна" })
  key!: string;

  @IsString() @MaxLength(100)
  name!: string;

  @IsOptional() @IsString() @MaxLength(100)
  nameEn?: string;

  @IsOptional() @IsNumber()
  sortOrder?: number;
}
