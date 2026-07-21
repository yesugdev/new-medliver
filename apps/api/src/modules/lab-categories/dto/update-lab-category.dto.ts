import { IsBoolean, IsOptional, IsString, IsNumber, MaxLength } from "class-validator";

/** key талбар зориудаар ороогүй — үүсгэсний дараа өөрчлөгдөхгүй, LabTest холбоосыг хамгаална */
export class UpdateLabCategoryDto {
  @IsOptional() @IsString() @MaxLength(100)
  name?: string;

  @IsOptional() @IsString() @MaxLength(100)
  nameEn?: string;

  @IsOptional() @IsNumber()
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
