import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UpdateEbarimtConfigDto {
  @IsOptional() @IsBoolean()
  enabled?: boolean;

  @IsOptional() @IsString() @MaxLength(200)
  posApiUrl?: string;

  @IsOptional() @IsString() @MaxLength(14)
  @Matches(/^(\d{11}|\d{14})?$/, { message: "ТТД 11 эсвэл 14 оронтой тоо байна" })
  merchantTin?: string;

  @IsOptional() @IsString() @MaxLength(4)
  districtCode?: string;

  @IsOptional() @IsString() @MaxLength(20)
  posNo?: string;

  @IsOptional() @IsString() @MaxLength(20)
  classificationCode?: string;
}
