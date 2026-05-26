import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import type { AuthUser } from "@his/shared";
import { ROLES } from "@his/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { VitalsService } from "./vitals.service";
import { CreateVitalsRecordDto } from "./dto/create-vitals-record.dto";

@Controller("vitals")
export class VitalsController {
  constructor(private readonly service: VitalsService) {}

  /** POST /vitals — record vitals for any patient */
  @Post()
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE)
  create(@Body() dto: CreateVitalsRecordDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  /** GET /vitals?patientId=xxx — list vitals history */
  @Get()
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  listByPatient(@Query("patientId") patientId: string) {
    return this.service.listByPatient(patientId);
  }

  /** GET /vitals/latest?patientId=xxx */
  @Get("latest")
  @Roles(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTION)
  getLatest(@Query("patientId") patientId: string) {
    return this.service.getLatest(patientId);
  }
}
