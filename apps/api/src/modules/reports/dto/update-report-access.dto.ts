import { IsArray, IsIn } from "class-validator";
import { ALL_ROLES, type Role } from "@his/shared";

export class UpdateReportAccessDto {
  @IsArray()
  @IsIn(ALL_ROLES, { each: true })
  roles!: Role[];
}
