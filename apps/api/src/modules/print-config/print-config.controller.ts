import { Body, Controller, Get, Put } from "@nestjs/common";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { PrintConfigService } from "./print-config.service";
import {
  IsBoolean, IsInt, IsOptional, IsString, Max, Min, MaxLength, IsIn,
} from "class-validator";
import { Type } from "class-transformer";

class UpdatePrintConfigDto {
  @IsOptional() @IsString() @MaxLength(100)  orgName?: string;
  @IsOptional() @IsString() @MaxLength(100)  orgSubtitle?: string;
  @IsOptional() @IsString() @MaxLength(300)  orgAddress?: string;
  @IsOptional() @IsString() @MaxLength(50)   orgPhone?: string;
  @IsOptional() @IsString() @MaxLength(100)  orgEmail?: string;
  @IsOptional() @IsString()                   logoUrl?: string;
  @IsOptional() @IsBoolean()                  showLogo?: boolean;
  @IsOptional() @IsString()                   stampUrl?: string;
  @IsOptional() @IsBoolean()                  showStamp?: boolean;
  @IsOptional() @IsString() @MaxLength(20)   headerBgColor?: string;
  @IsOptional() @IsString() @MaxLength(20)   headerTextColor?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(10) @Max(18) fontSize?: number;
  @IsOptional() @IsIn(["A4", "A5"])           pageSize?: "A4" | "A5";
  @IsOptional() @IsIn(["portrait", "landscape"]) pageOrientation?: "portrait" | "landscape";
  @IsOptional() @IsString() @MaxLength(200)  footerNote?: string;
}

@Controller("print-config")
export class PrintConfigController {
  constructor(private readonly svc: PrintConfigService) {}

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  get() {
    return this.svc.get();
  }

  @Put()
  @Roles(ROLES.ADMIN)
  update(@Body() dto: UpdatePrintConfigDto) {
    return this.svc.update(dto);
  }
}
