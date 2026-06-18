import { Body, Controller, Get, Put } from "@nestjs/common";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { HospitalConfigService } from "./hospital-config.service";
import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";

class UpdateHospitalConfigDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() logoBase64?: string;
  @IsOptional() @IsString() faviconBase64?: string;
  @IsOptional() @IsBoolean() vatEnabled?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) vatRate?: number;
}

@Controller("hospital-config")
export class HospitalConfigController {
  constructor(private readonly svc: HospitalConfigService) {}

  @Get()
  @Public()
  get() {
    return this.svc.get();
  }

  @Put()
  @Roles(ROLES.ADMIN)
  update(@Body() dto: UpdateHospitalConfigDto) {
    return this.svc.update(dto);
  }
}
