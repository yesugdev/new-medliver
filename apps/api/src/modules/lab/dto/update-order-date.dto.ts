import { IsISO8601 } from "class-validator";

export class UpdateOrderDateDto {
  @IsISO8601()
  date!: string;
}
