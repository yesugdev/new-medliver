import { IsOptional, IsISO8601 } from "class-validator";

export class ReportRangeDto {
  /** YYYY-MM-DD — байхгүй бол өнөөдөр */
  @IsOptional() @IsISO8601()
  from?: string;

  /** YYYY-MM-DD — байхгүй бол өнөөдөр */
  @IsOptional() @IsISO8601()
  to?: string;
}
