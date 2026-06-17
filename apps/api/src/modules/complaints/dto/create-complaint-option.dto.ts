import { IsEnum, IsString, MaxLength } from "class-validator";

export class CreateComplaintOptionDto {
  @IsEnum(["complaint", "location"])
  category!: "complaint" | "location";

  @IsString()
  @MaxLength(200)
  name!: string;
}
